# Archived

> :warning: This CLI has been deprecated in favor of the [smartthings-cli](https://github.com/SmartThingsCommunity/smartthings-cli).

# Example - SmartThings Switches CLI

An example CLI implementation to get devices and their status, and control SmartThings-connected switches.

## Prerequisites

1. [Node.js](https://nodejs.org) and [npm](https://npmjs.com) installed (verified with npm version 4.0.5 and Node 7.4.0).

## Installation

1. Clone or download this repository.
2. Create a [personal access token](https://account.smartthings.com/tokens/new) with **all Devices scopes selected**. Copy or store this token in a secure place.
3. Create an environment variable named `SMARTTHINGS_CLI_TOKEN`, and set its value to your personal access token obtained in step 2).
4. Install the CLI: `npm install -g` (alternatively, you may invoke the CLI directly via `node cli.js <commands>`)

## Usage

At any time, you can view usage instructions by entering `sthelper --help`.

### List devices

To list all devices (not just switches):

`sthelper list`

### Get device status

`sthelper status "your device name"`

Multiple devices can be specified:

`sthelper status "my device 1" "my device 2"`

To get the status of all devices:

`sthelper status`

### Turn switches on

To turn on a specific switch:

`sthelper turnon "your switch name"`

To turn on all switches (careful, this will turn on all switches your token has access to!):

`sthelper turnon`

### Set switch level and color

To set the level and/or color of a switch, specify the `--level` and/or `--color` options (the device must support the "Switch Level" and "Color Control" capabilities for this to work):

`sthelper turnon "your switch name" --level 80 --color blue`

Supported colors are white, blue, green, yellow, orange, purple, pink, and red.

You may also specify multiple switches (that support the "Switch Level" and/or "Color Control" capabilities):

`sthelper turnon "kitchen lights" "family room lights" --level 20`

### Turn switches off

To turn off a specific switch:

`sthelper turnoff "your switch name"`

Multiple switches may be specified:

`sthelper turnoff "switch 1" "switch 2"`

To turn off all switches:

`sthelper turnoff`

## Additional information

- This example uses the SmartThings API. See the [API documentation](https://smartthings.developer.samsung.com/develop/api-ref/st-api.html) for more information.
