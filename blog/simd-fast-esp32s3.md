# SIMD-accelerated computer vision on a $2 microcontroller

> I wrote an accelerated FAST feature detector for the ESP32-S3 that leverages its 128-bit SIMD instructions. It achieves roughly double the performance of the reference implementation, and takes around ~6ms to process a QVGA (320x240) frame.

For its price, the ESP32-S3 is a powerhouse of a microcontroller. Within its unassuming plastic package lies a dual-core CPU running at a maximum of 240MHz with a slew of peripherals, including WiFi and Bluetooth Low Energy radios. While digging through its [technical reference manual](https://www.espressif.com/sites/default/files/documentation/esp32-s3_technical_reference_manual_en.pdf) I discovered that the chip supports a limited set of SIMD instructions. For silicon that's cheaper than the average coffee, that's pretty cool. Let's see what exciting things we can do with it!

In the process of writing a SIMD-accelerated FAST corner detector, I learned the basics of assembly on the ESP32-S3, worked around its eccentric limitations, and ended up writing my own basic register allocator, `basm`. I've posted the source code [here](https://github.com/shraiwi/simd-fast-esp32s3).

---

After some more web browsing, I realized that these instructions weren't exactly [secret](https://bitbanksoftware.blogspot.com/2024/01/surprise-esp32-s3-has-few-simd.html), but rather relatively unknown. I wanted to experiment with them myself and write more advanced code than what I could find online. As I've been really interested in computer vision lately, I decided on writing a SIMD-accelerated implementation of the [FAST feature detector](https://en.wikipedia.org/wiki/Features_from_accelerated_segment_test) for the ESP32-S3. 

I started by looking for example code that uses SIMD instructions. At the time of writing, I could only find three sources:

1. [Larry Bank's blog](https://bitbanksoftware.blogspot.com/), where he explores the feature and provides a [minimal example](https://bitbanksoftware.blogspot.com/2024/01/esp32-s3-simd-minimal-example.html)
2. Espressif's [`esp-dsp`](https://github.com/espressif/esp-dsp) library, used for DSP-esque features (convolutions, FFT, etc.)
3. Espressif's [`esp-dl`](https://github.com/espressif/esp-dl) library, used for on-chip AI acceleration.

After perusing through them, I was relieved to find that assembly on the ESP32-S3 isn't that bad. I settled on this general structure:

```S
    .section .rodata
	# read-only data here

    .section .text
    .align 4

    .global add
    .type   add,@function
# a simple function that adds two numbers
# int32_t add(int32_t a, int32_t b)
add:
    entry           sp, 48 # sp (stack pointer) is an alias for a1
    
    #define r_a a2
    #define r_b a3

	# code here
    
	add a2, r_a, r_b # a2 = a + b

    retw.n # return, with a2 containing the return value.
```

From there, I started writing a SIMD-accelerated version of the FAST corner pre-test. Essentially, it samples one pixel in each cardinal direction and checks if there are at least three "extreme" pixels. In this case, an extreme pixel is one whose absolute difference from the center pixel is above a certain threshold.

I decided on a function that would calculate the extrema count of sixteen pixels at a time, since each vector register can store sixteen eight-bit values. This would be achieved by sampling four "chunks" of pixels in each cardinal direction and comparing them to their respective center pixels.

However, this is where I ran into my first limitation- the ISA doesn't allow for direct misaligned reads. Under the assumption that the center pixel would be aligned, the east and west blocks would be misaligned:

<svg width="400pt" height="144pt" version="1.1" viewBox="0 0 141.11 50.8" xmlns="http://www.w3.org/2000/svg">
<g>
<rect y="22.578" width="90.311" height="5.6444" fill="#d780ff"/>
<rect x="22.578" y="22.578" width="90.311" height="5.6444" fill="#ffdb80"/>
<rect x="22.578" y="-3.5527e-15" width="90.311" height="5.6444" fill="#ff8989"/>
<rect x="50.8" y="22.578" width="90.311" height="5.6444" fill="#caff80"/>
<rect x="22.578" y="45.156" width="90.311" height="5.6444" fill="#80daff"/>
<text x="23.425106" y="27.483587" fill="#000000" font-family="sans-serif" font-size="2.9551px" font-weight="bold" stroke-width=".70556" xml:space="preserve"><tspan x="23.425106" y="27.483587" fill="#000000" font-family="sans-serif" font-weight="bold" stroke-width=".70556">center</tspan></text>
<text x="51.466038" y="27.483589" fill="#000000" font-family="sans-serif" font-size="2.9551px" font-weight="bold" stroke-width=".70556" xml:space="preserve"><tspan x="51.466038" y="27.483589" fill="#000000" font-family="sans-serif" font-weight="bold" stroke-width=".70556">east</tspan></text>
<text x="0.61509866" y="27.483589" fill="#000000" font-family="sans-serif" font-size="2.9551px" font-weight="bold" stroke-width=".70556" xml:space="preserve"><tspan x="0.61509866" y="27.483589" fill="#000000" font-family="sans-serif" font-weight="bold" stroke-width=".70556">west</tspan></text>
<text x="23.487152" y="4.7862697" fill="#000000" font-family="sans-serif" font-size="2.9551px" font-weight="bold" stroke-width=".70556" xml:space="preserve"><tspan x="23.487152" y="4.7862697" fill="#000000" font-family="sans-serif" font-weight="bold" stroke-width=".70556">north</tspan></text>
<text x="23.322832" y="49.840652" fill="#000000" font-family="sans-serif" font-size="2.9551px" font-weight="bold" stroke-width=".70556" xml:space="preserve"><tspan x="23.322832" y="49.840652" fill="#000000" font-family="sans-serif" font-weight="bold" stroke-width=".70556">south</tspan></text>
</g>
</svg>

Thankfully, the chip has an <abbr title="EE.SRC.Q">instruction</abbr> that allows for extracting a slice of two concatenated registers into another one. Using this functionality, I was able to extract the east and west blocks by reading and extracting slices from the two blocks adjacent to the center block.

Okay, so now I have the pixel data. Time to do some comparisons, right? Wrong. Turns out the ESP32-S3's only implements comparisons for signed eight-bit numbers. This made processing a little more difficult, because all my pixel data was stored as unsigned eight-bit numbers. If you just reinterpreted the unsigned data as signed data, you get some weird results:

```py
>>> np.int8(np.uint8(range(0, 256, 8)))
array([   0,    8,   16,   24,   32,   40,   48,   56,   64,   72,   80,
         88,   96,  104,  112,  120, -128, -120, -112, -104,  -96,  -88,
        -80,  -72,  -64,  -56,  -48,  -40,  -32,  -24,  -16,   -8],
      dtype=int8)
```

The range `[128 255]` gets nonlinearly mapped to `[-128 -1]`, breaking all compare operations. To make this work, I needed to shift the range of the values from `[0, 255]` to `[-128 127]`. This should've been a simple subtraction, but the instruction set got in the way again: on the ESP32-S3, all the SIMD arithmetic operations are saturating, which meant that all pixel values above 127 would end up being clamped at -128 instead of underflowing to their appropriate values. To overcome this problem, I had to somehow subtract 128 from each number in parallel without using the subtraction instruction. This seemed like a daunting task to me at first, but I eventually arrived at a solution. 

Let's assume that `x` is the <abbr title="the left-hand value in a subtraction operation">minuend</abbr>. Here is its digits' place values:

```
-128 64 32 16 8 4 2 1
```

Notice anything interesting? Subtraction is the same as addition by -128, so to compute `x - 128`, we can just "increment" the number by -128 by adding one to `x`'s most significant digit, whose place value is -128. We can compute this by simply flipping the highest bit of `x`. Since XORing any bit with one is the same as taking the bitwise NOT, we can selectively flip the highest bit of `x` by XORing it with the bit mask `0b10000000`, which equal to `0x80`. Therefore, `x - 128 == x ^ 0x80`. 

Now, whenever unsigned eight-bit values are loaded in, they are XOR'd with `0x80` to convert them an appropriate (linear) range where the arithmetic and comparisons make sense again.

With those two tricks, I was able to circumvent the limitations of the ESP32-S3 and write the SIMD-accelerated FAST corner pre-test. I also wrote a SIMD-accelerated scoring function using a similar set of operations but I won't be writing about that here.

In the end, I was able to improve the throughput of the FAST feature detector by about 220%, from 5.1MP/s to 11.2MP/s in my testing. This is well within the acceptable range of performance for realtime computer vision tasks, enabling the ESP32-S3 to easily process a 30fps VGA stream. Not bad for $2!