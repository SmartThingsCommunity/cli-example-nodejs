#!/usr/bin/env node

/**
 * SmartThings CLI
 *
 * Copyright 2017 SmartThings
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const rp = require('request-promise');
const config = require('config');

const api = 'https://api.smartthings.com/v1';
const token = process.env.SMARTTHINGS_CLI_TOKEN;
const program = require('commander');
const prettyjson = require('prettyjson');
const prettyjsonOptions = {};

program.version('0.0.1');

program
  .command('list')
  .description('list all devices')
  .action(function(env, options) {
    getDevices()
      .then(function(devices) {
        console.log(`${prettyjson.render(devices, prettyjsonOptions)}`);
      })
      .catch(function(err) {
        console.error(`error getting devices: ${err}`);
      });
  });

program
  .command('turnoff [names...]')
  .description('Turn off switch devices. Specify a specific switch name (use quotes if name contains spaces), or omit to turn off all switches. Multiple devices can be specified (sthelper turnoff "my device 1" "my device 2").')
  .action(function(names) {
    if (names && names.length) {
      names.forEach(function(name) {
        actuateSwitches([{command: 'off', capability: 'switch', component: 'main', arguments: []}], name);
      })
    } else {
      actuateSwitches([{command: 'off', capability: 'switch', component: 'main', arguments: []}], null);
    }
  });

program
  .command('status [names...]')
  .description('Get the status of the specified device. Specify a device name (use quotes if the name contains spaces), or omit to list all device states.  Multiple devices can be specified (sthelper status "my device 1" "my device 2").')
  .action(function(names) {
    if (names && names.length) {
      names.forEach(function(name) {
        getStatus(name);
      });
    } else {
      console.log('getting status for all...');
      getStatus(null);
    }

  });

program
  .command('turnon [names...]')
  .description('Turn on all switch devices. Specify a specific switch name (use quotes if name contains spaces), or omit to turn on all switches. Multiple switches can be specified (sthelper turnon "my switch 1" "my switch 2").')
  .option('-l, --level <number>', 'Set the bulb to the specified brightness level.', parseInt)
  .option('-c --color <color>', 'Set the bulb to the specified color. Supported colors are white, blue, green, yellow, orange, purple, pink, and red.')
  .action(function(names, options) {
    let commands = [
      {
        command: 'on',
        capability: 'switch',
        component: 'main',
        arguments: []
      }
    ];
    if (options.level) {
      commands.push({
        command: 'setLevel',
        capability: 'switchLevel',
        component: 'main',
        arguments: [options.level]
      });
    }
    if (options.color) {
      let colorArgs = getColor(options.color);
      commands.push({
        command: 'setColor',
        capability: 'colorControl',
        component: 'main',
        arguments: [colorArgs]
      });
    }
    if (names && names.length) {
      names.forEach(function(name) {
        actuateSwitches(commands, name);
      })
    } else {
      actuateSwitches(commands, null);
    }
  });

program.parse(process.argv);

/**
 * Gets the status of the specified device, or all devices if name not
 * and logs them to the console.
 *
 * @param {string} name - The name of the device to get the status for. If not
 *  specified, all device status will be returned.
 *
 * @returns {undefined}
 */
function getStatus(name) {
  getDevices()
    .then(function(devices) {
      let deviceMapping = devices.map(function(item) {
        return {id: item.deviceId, name: item.label || item.name};
      });
      if (name) {
        let device = deviceMapping.find(function(elem) {
          return elem.name.toLowerCase() === name.toLowerCase();
        });
        if (device) {
          getDeviceStatus(device.id)
            .then(function(status) {
              console.log(`device status: ${prettyjson.render(status, prettyjsonOptions)}`);
            })
            .catch(function(err) {
              console.error(`Error getting device status for device ${device.name} with device ID ${device.id}`);
            });
        } else {
          console.error(`NO DEVICE FOUND WITH NAME: ${name}`);
        }
      } else {
        deviceMapping.forEach(function(device) {
          getDeviceStatus(device.id)
            .then(function(status) {
              console.log(`\n${device.name}:`);
              console.log(`${prettyjson.render(status, prettyjsonOptions)}`);
            })
            .catch(function(err) {
              console.error(`Error getting device status for device ${device.name} with device ID ${device.id}`);
            });
        });
      }
    })
    .catch(function(err) {
      console.error(`Error getting switches: ${err}`);
    });
}

/**
 * Returns a request-promise for the status of the specified deviceId.
 *
 * @param {string} deviceId - The ID of the device.
 *
 * @returns {Object} - The request-promise for this API call.
 */
function getDeviceStatus(deviceId) {
  const options = {
    method: 'GET',
    url: `${api}/devices/${deviceId}/status`,
    json: true,
    headers: {
      'Authorization': 'Bearer: ' + token
    }
  };
  return rp(options);
}

/**
 * Sends commands for switch devices to the SmartThings API.
 *
 * @param {string} commands - An array of commands to execute.
 * @param {string} name - The name of the device to execute the commands on.
 *  If not specified, all Switch devices will be sent the commands.
 *
 * @returns {undefined}
 */
function actuateSwitches(commands, name) {
  getDevices('switch')
    .then(function(switches) {
      let devices = switches.map(function(item) {
        return {id: item.deviceId, name: item.label || item.name};
      });
      if (name) {
        let device = devices.find(function(elem) {
          return elem.name.toLowerCase() === name.toLowerCase();
        });
        if (device) {
          actuate(device.id, commands)
            .then(function(resp) {
              let cmds = commands.map(function(it) {
                return `'${it.command}'`;
              }).join(', ');
              console.log(`Successfully sent commands ${cmds} to device ${name}`);
            })
            .catch(function(err) {
              let cmds = commands.map(function(it) {
                return `'${it.command}'`;
              }).join(', ');
              console.error(`Error executing commands ${cmds} on switch with ID ${device.id}`);
            });
        } else {
          console.error(`No device found with name "${name}"`);
        }
      } else {
        devices.forEach(function(device) {
          actuate(device.id, commands)
            .then(function(resp) {
              let cmds = commands.map(function(it) {
                return `'${it.command}'`;
              }).join(', ');
              console.log(`Successfully executed commands ${cmds} on device ${device.name}`);
            })
            .catch(function(err) {
              let cmds = commands.map(function(it) {
                return `'${it.command}'`;
              }).join(', ');
              console.error(`Error executing commands ${cmds}: ${err}`);
            })
        });
      }
    })
    .catch(function(err) {
      console.error(`Error gettings switches: ${err}`);
    });
}

/**
 * Configures and returns a request-promise to actuate a device using the
 * SmartThings API.
 *
 * @param {string} switchId - The ID of the switch.
 * @param {Array} commands - An array of commands to send to the device.
 *
 * @returns {Object} - The request-promise for this API request.
 */
function actuate(switchId, commands) {
  const options = {
    method: 'POST',
    url: `${api}/devices/${switchId}/commands`,
    json: true,
    headers: {
      'Authorization': 'Bearer: ' + token
    },
    body: commands
  };
  return rp(options);
}

/**
 * Gets a list of devices.
 *
 * @param {string} capability - The capability to filter by; if not specified,
 *  all devices will be returned.
 * @param {string} url - The URL to make the request to. Used to handle paging;
 *  calling clients should not need to specify this.
 * @param {Array} devicesAccum - An accumulator for recursive API calls to
 *  handle paged result sets. Calling clients should not need to specify this.
 *
 * @returns {Object} - The request-promise for this API request.
 */
function getDevices(capability, url, devicesAccum) {
  return rp({
    method: 'GET',
    url: url || `${api}/devices`,
    qs: capability ? {capability: capability} : {},
    json: true,
    headers: {
      'Authorization': 'Bearer: ' + token
    }
  }).then(function(response) {
    if (!devicesAccum) {
      devicesAccum = [];
    }
    devicesAccum = devicesAccum.concat(response.items);
    if (response._links.next) {
      return getDevices(capability, response._links.next.href, devicesAccum);
    }
    return devicesAccum;
  })
  .catch(function(err) {
    console.log(`Error getting devices: ${err}`);
  });
}

/**
 * Gets the color map required by the setColor command of the Color Control
 * Capability.
 *
 * @param {string} colorString - The color specified (e.g., "blue", "red", etc.)
 *
 * @returns {Object} - A color map object for use with the setColor command
 */
function getColor(colorString) {
  let hue = 0;
  let saturation = 100;
  switch (colorString.toLowerCase()) {
    case "blue":
      hue = 70;
      break;
    case "red":
      hue = 10;
      break;
    case "purple":
      hue = 75;
      break;
    case "white":
      hue = 79;
      saturation = 7;
    case "green":
      hue = 39;
      break;
    case "yellow":
      hue = 25;
      break;
    case "orange":
      hue = 10;
      break;
    case "pink":
      hue = 83;
      break;
    default:
      // default is white
      console.log(`Color ${colorString} not supported. Supported colors are white, blue, green, yellow, orange, purple, pink, and red. Setting color to white.`)
      hue = 79;
      saturation = 7;
  }

  let colorMap = {hue: hue, saturation: saturation};
  return colorMap;
}
