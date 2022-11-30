---
title: Project Tracer
---

![](media/tracer-logo.png)

Project Tracer is an ESP32-based low-power contact tracing device that is compatible with the Google-Apple Exposure Notification Protocol. It is completely privacy-preserving and can work independently from a smartphone, but retains cross-device contact tracing functionality.

## Project Demo

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/fehssvGHECE" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## The Source Idea

Most people have phones. So, what if instead of relying on people to
identify people, we can use phones? This is exactly the idea behind the
contact tracing standard being developed by Apple and Google, in a
partnership. Their idea is to use a phone\'s BLE (Bluetooth Bow Energy)
radio to transmit and scan for encrypted data. In the case of a positive
diagnosis, a user can see if and when they\'ve been in contact with
someone with COVID-19, but not *who,* which allows for completely
private and secure contact tracing.

In theory, it makes sense. But, in practice, there are some issues with
this approach:

-   Not everyone has a phone.
-   Some phones do not have a BLE radio or compatible software.
-   Phones have poor battery life (1-2 days at best)

With this in mind, I came up with a solution: Project Tracer. It is a
small sized, low-power device which implements the aforementioned
contact tracing standard.

## What Are the Benefits?

As opposed to other methods of contact tracing, Project Tracer has
multiple benefits.

-   **🔐 Ensures User Privacy**

> Unlike other methods of contact tracing that use machine vision or
> GPS, no personally-identifying data will ever be recorded or stored by
> the device. All of the information used to notify others of potential
> exposures is randomly generated and encrypted.

-   **🔋 Long Battery Life**

> Project Tracer provides an extremely low-maintenance method of contact
> tracing as opposed to phones. While a user\'s phone may run out of
> battery after less than a day, Project Tracer\'s projected power
> consumption can keep the device running for almost 5 days. In fact,
> the average power consumption is so low that the device can be charged
> by a single solar cell!

-   **👐 Simple Setup**

> Just tap a button, connect to the hotspot, and configure the device!

-   **💲 Low Cost**

> While the BOM cost for a single device in individual quantities is
> high (about \$13), bulk pricing can bring the price down to something
> as low as \$5 per device.

## How Does it Work?

Before getting into the project, it\'s important to understand the
fundamental principles which are the backbone of the project:

-   Encryption is a one-way transformation that can only be reversed by
    the encryption key.
-   Cryptographically secure random numbers are completely random and
    cannot be predicted in any way.

With these concepts in mind, Here\'s how the system works.

Every day, a random number called the TEK (Temporary Exposure Key) is
generated. From the TEK, two additional keys are generated: the RPIK
(Rolling Proximity Identifier Key) and AEMK (Associated Encrypted
Metadata Key).

Every 10 minutes, the RPIK is used to encrypt the string \"EN-RPI\",
along with the UNIX epoch time at encryption into what\'s called an RPI
(Rolling Proximity Identifier). Additionally, the system will use the
AEMK and the RPI to encrypt some additional metadata into what\'s called
the AEM (Associated Encrypted Metadata). The AEM and RPI are then
combined and transmitted by the integrated Bluetooth Low Energy Radio to
nearby devices.

When the device would like to check whether or not it has been exposed
to an individual with COVID-19, it simply starts by downloading the TEKs
which have been submitted to a keyserver. For each TEK downloaded, it
derives its respective RPIK and AEMK and attempts to decrypt the data
that has been scanned from nearby devices. Due to the nature of
Bluetooth (radio waves only travel so far), it is possible for the
device to determine whether or not the user has been exposed to someone
with COVID-19.

If you want a more in-depth read, and also how exactly to implement the
standard, please take a look at some of the
documents [here](https://www.apple.com/covid19/contacttracing). The part of the standard outlined above is
the [Cryptography Specification, v1.2](https://covid19-static.cdn-apple.com/applications/covid19/current/static/contact-tracing/pdf/ExposureNotification-CryptographySpecificationv1.2.pdf)
