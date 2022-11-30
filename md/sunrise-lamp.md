---
title: ECE Discovery Project
---

# ECE Discovery Project: Sunrise Lamp

## Rationale
For my ECE 1100 class, I decided to combat morning sleepiness and missed classes by building a custom sunrise lamp for my dorm. In my shared dorm, I am the furthest from the window, which has been causing unforeseen problems with my ability to stay awake after my alarm. In High School, I remember looking at the window (and the sunlight) every morning to wake me up. However, I do not have direct access to a window. For that reason, I wanted to emulate the sun using a fully-custom sunrise lamp. It should help regulate my circadian rhythm and ease me into the day better than a loud alarm can.

## Prototypes
The final sunrise lamp should have:

- [x] A color temperature that starts warm and becomes cold over time (as the sun rises)
- [ ] A bright enough light that can wake me up (or at least *help* me wake up)
- [ ] An interface to upload weekly alarm schedules wirelessly (BUT NOT OVER WIFI!!!)
	- I'm planning to do this using a photoresistor and a custom serial protocol that uses the screen of a host device to "flash out" binary data, like Morse Code.
- [ ] Fairly accurate (1 hour clock drift per 3 months max)

### Prototype 1: Simulated ATTiny85 + WS2812B LED Ring
I initially planned on making the whole thing out of an ATTiny85, but due to the chip shortage I couldn't find any through-hole ATTiny85s on DigiKey for a reasonable price. For that reason, I decided to first [build a prototype](https://wokwi.com/projects/349682624993690195) in the Wokwi circuit simulator, and then transfer it to a real circuit at a later date.

- [x] Wire circuit
	- ATTiny85, DS1307 RTC Clock, WS2812B LED Ring
- [x] Code color temperature -> RGB values
- [x] Code sunrise animation
- [ ] Code alarms + reconfigurable weekly alarm times

![Sunrise Lamp](media/sunrise-lamp-sim.png)

### Prototype 2: Arduino UNO + Temperature-Controllable LED

- [ ] Wire circuit
	- Arduino UNO, DS1307 RTC Clock, Warm + Sunlight LEDs
- [ ] Code color temperature -> PWM values
- [ ] Port sunrise animation
- [ ] Port alarms + reconfigurable weekly alarm times
- [ ] Code schedule upload via photoresistor

