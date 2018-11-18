'use strict';
const utils = require(__dirname + '/lib/utils'); // Get common adapter utils
const adapter = utils.Adapter('roomba');


/*
 * internal libraries
 */
const Library = require(__dirname + '/library.js');
const Roomba = require('dorita980');


/*
 * variables initiation
 */
var library;
var robot;
var settings = {
	decode: {
		key: 'hZTFui87HVG45shg$', // used for encrypted password
		fields: ['password']
	}
};

var listeners = ['start', 'stop', 'pause', 'resume', 'dock']; // state that trigger actions
var nodes = [
	// cleaning
	{'node': 'cleaning.start', 'description': 'Start a cleaning process', 'action': 'start'},
	{'node': 'cleaning.stop', 'description': 'Stop the current cleaning process', 'action': 'stop'},
	{'node': 'cleaning.pause', 'description': 'Pause the current cleaning process', 'action': 'pause'},
	{'node': 'cleaning.resume', 'description': 'Resume the current cleaning process', 'action': 'resume'},
	{'node': 'cleaning.dock', 'description': 'Send the robot to the docking station', 'action': 'dock'},
	
	// cleaning - schedule
	{'node': 'cleaning.schedule.cycle', 'description': 'Schedule cycle (Sunday to Saturday)', 'preference': 'cleanSchedule.cycle'},
	{'node': 'cleaning.schedule.hours', 'description': 'Hour to start cycle (Sunday to Saturday)', 'preference': 'cleanSchedule.h'},
	{'node': 'cleaning.schedule.minutes', 'description': 'Minute to start cycle (Sunday to Saturday)', 'preference': 'cleanSchedule.m'},
	
	// cleaning - last command
	{'node': 'cleaning.last.command', 'description': 'Last command sent to robot', 'preference': 'lastCommand.command'},
	{'node': 'cleaning.last.timestamp', 'description': 'Timestamp last command was sent', 'preference': 'lastCommand.time'},
	{'node': 'cleaning.last.datetime', 'description': 'DateTime last command was sent', 'preference': 'lastCommand.time', 'type': 'datetime'},
	{'node': 'cleaning.last.initiator', 'description': 'Initiator of last command', 'preference': 'lastCommand.initiator'},
	
	// device
	{'node': 'device.mac', 'description': 'Mac address of the robot', 'preference': 'mac'},
	{'node': 'device.name', 'description': 'Name of the robot', 'preference': 'name'},
	
	// device - network
	{'node': 'device.network.dhcp', 'description': 'State whether DHCP is activated', 'preference': 'netinfo.dhcp'},
	{'node': 'device.network.router', 'description': 'Mac address of router', 'preference': 'netinfo.bssid'},
	{'node': 'device.network.ip', 'description': 'IP address', 'preference': 'netinfo.addr', 'type': 'ip'},
	{'node': 'device.network.subnet', 'description': 'Subnet adress', 'preference': 'netinfo.mask', 'type': 'ip'},
	{'node': 'device.network.gateway', 'description': 'Gateway address', 'preference': 'netinfo.gw', 'type': 'ip'},
	{'node': 'device.network.dns1', 'description': 'Primary DNS address', 'preference': 'netinfo.dns1', 'type': 'ip'},
	{'node': 'device.network.dns2', 'description': 'Secondary DNS address', 'preference': 'netinfo.dns2', 'type': 'ip'},
	
	// device - versions
	{'node': 'device.versions.hardwareRev', 'description': '', 'preference': 'hardwareRev'},
	{'node': 'device.versions.batteryType', 'description': '', 'preference': 'batteryType'},
	{'node': 'device.versions.soundVer', 'description': '', 'preference': 'soundVer'},
	{'node': 'device.versions.uiSwVer', 'description': '', 'preference': 'uiSwVer'},
	{'node': 'device.versions.navSwVer', 'description': '', 'preference': 'navSwVer'},
	{'node': 'device.versions.wifiSwVer', 'description': '', 'preference': 'wifiSwVer'},
	{'node': 'device.versions.mobilityVer', 'description': '', 'preference': 'mobilityVer'},
	{'node': 'device.versions.bootloaderVer', 'description': '', 'preference': 'bootloaderVer'},
	{'node': 'device.versions.umiVer', 'description': '', 'preference': 'umiVer'},
	{'node': 'device.versions.softwareVer', 'description': '', 'preference': 'softwareVer'},
	
	// preferences
	{'node': 'device.preferences.noAutoPasses', 'description': 'One Pass: Roomba will cover all areas with a single cleaning pass.', 'preference': 'noAutoPasses'},
	{'node': 'device.preferences.noPP', 'description': '', 'preference': 'noPP'},
	{'node': 'device.preferences.binPause', 'description': '', 'preference': 'binPause'},
	{'node': 'device.preferences.openOnly', 'description': '', 'preference': 'openOnly'},
	{'node': 'device.preferences.twoPass', 'description': 'Roomba will cover all areas a second time. This may be helpful in homes with pets or for occasional deep cleaning.', 'preference': 'twoPass'},
	{'node': 'device.preferences.schedHold', 'description': '', 'preference': 'schedHold'},
	
	{'node': 'device.preferences.carpetBoostAuto', 'description': 'Automatic: Roomba will automatically boost its vacuum power to deep clean carpets.', 'preference': 'carpetBoost'},
	{'node': 'device.preferences.carpetBoostHigh', 'description': 'Performance Mode: Roomba will always boost its vacuum to maximise cleaning performance on all floor surfaces.', 'preference': 'vacHigh'},
	{'node': 'device.preferences.ecoCharge', 'description': '', 'preference': 'ecoCharge'},
	
	
	// states
	{'node': 'states.battery', 'description': 'Battery level of the robot', 'preference': 'batPct'},
	{'node': 'states.docked', 'description': 'State whether robot is docked', 'preference': 'dock.known'},
	{'node': 'states.binInserted', 'description': 'State whether bin is inserted', 'preference': 'bin.present'},
	{'node': 'states.binFull', 'description': 'State whether bin status is full', 'preference': 'bin.full'},
	{'node': 'states.status', 'description': 'Current status of the robot', 'preference': 'cleanMissionStatus.phase'},
	{'node': 'states.signal', 'description': 'Signal strength', 'preference': 'signal.snr'},
	
	// statistics - missions
	{'node': 'statistics.time.avgMin', 'description': '', 'preference': 'bbchg3.avgMin'},
	{'node': 'statistics.time.hOnDock', 'description': '', 'preference': 'bbchg3.hOnDock'},
	{'node': 'statistics.time.nAvail', 'description': '', 'preference': 'bbchg3.nAvail'},
	{'node': 'statistics.time.estCap', 'description': '', 'preference': 'bbchg3.estCap'},
	{'node': 'statistics.time.nLithChrg', 'description': '', 'preference': 'bbchg3.nLithChrg'},
	{'node': 'statistics.time.nNimhChrg', 'description': '', 'preference': 'bbchg3.nNimhChrg'},
	{'node': 'statistics.time.nDocks', 'description': '', 'preference': 'bbchg3.nDocks'},
	
	// statistics - missions
	{'node': 'statistics.missions.total', 'description': 'Number of cleaning jobs', 'preference': 'bbmssn.nMssn'},
	{'node': 'statistics.missions.succeed', 'description': 'Number of successful cleaning jobs', 'preference': 'bbmssn.nMssnOk'},
	//{'node': 'statistics.missionsC', 'description': '', 'preference': 'bbmssn.nMssnC'},
	{'node': 'statistics.missions.failed', 'description': 'Number of failed cleaning jobs', 'preference': 'bbmssn.nMssnF'},
	//{'node': 'statistics.missions', 'description': '', 'preference': 'bbmssn.aMssnM'},
	//{'node': 'statistics.missions', 'description': '', 'preference': 'bbmssn.aCycleM'},
];


/*
 * ADAPTER UNLOAD
 *
 */
adapter.on('unload', function(callback)
{
    try
	{
        adapter.log.info('cleaned everything up...');
        callback();
    }
	catch(e)
	{
        callback();
    }
});


/*
 * ADAPTER READY
 *
 */
adapter.on('ready', function()
{
	// check if settings are set
	if (!adapter.config.username || !adapter.config.password || !adapter.config.ip)
	{
		adapter.log.error('Username, password and / or ip address missing!');
		return;
	}
	
	library = new Library(adapter);
	
	// connect to Roomba
	robot = new Roomba.Local(adapter.config.username, library.decode(settings.decode.key, adapter.config.password), adapter.config.ip); // username, password, ip
	
	// check if connection is successful
	var nodeConnected = {'node': 'states._connected', 'description': 'Connection state'};
	
	/*
	 * ROBOT CONNECT
	 */
	robot.on('connect', function()
	{
		library.set(nodeConnected, true);
	});
	
	/*
	 * ROBOT CLOSE
	 */
	robot.on('close', function(res)
	{
		library.set(nodeConnected, false);
		adapter.log.debug(JSON.stringify(res));
	});
	
	/*
	 * ROBOT OFFLINE
	 */
	robot.on('offline', function(res)
	{
		library.set(nodeConnected, false);
		adapter.log.debug(JSON.stringify(res));
	});
	
	/*
	 * ROBOT MISSION
	 */
	robot.on('mission', function(res)
	{
		//adapter.log.debug(JSON.stringify(res));
	});
	
	/*
	 * ROBOT PREFERENCES
	 */
	function updPreferences()
	{
		var tmp, preference, index;
		robot.getPreferences().then((preferences) =>
		{
			adapter.log.debug('Retrieved preferences: ' + JSON.stringify(preferences));
			
			nodes.forEach(function(node)
			{
				try
				{
					// action
					if (node.action !== undefined)
					{
						library.set(Object.assign(node, {common: {role: 'button', 'type': 'boolean'}}), false);
						adapter.subscribeStates(node.node); // attach state listener
					}
					
					// preference
					if (node.preference !== undefined)
					{
						tmp = Object.assign({}, preferences);
						preference = node.preference;
						
						while (preference.indexOf('.') > -1)
						{
							index = preference.substr(0, preference.indexOf('.'));
							preference = preference.substr(preference.indexOf('.')+1);
							tmp = tmp[index];
						}
						
						if (node.type !== undefined)
						{
							switch(node.type.toLowerCase())
							{
								case "ip":
									tmp[preference] = library.getIP(tmp[preference]);
									break;
								
								case "datetime":
									tmp[preference] = library.getDateTime(tmp[preference]*1000);
									break;
							}
						}
						
						library.set(node, tmp[preference]);
					}
				}
				catch(err) {adapter.log.error(JSON.stringify(err.message))}
			});
		});
		
		library.set({'node': 'refreshedTimestamp', 'description': 'Timestamp of last update'}, Math.floor(Date.now()/1000));
		library.set({'node': 'refreshedDateTime', 'description': 'DateTime of last update'}, library.getDateTime(Date.now()));
	};
	
	updPreferences();
	setInterval(updPreferences, adapter.config.refresh ? Math.round(parseInt(adapter.config.refresh)*1000) : 60000);
});

/*
 * STATE CHANGE
 *
 */
adapter.on('stateChange', function(node, state)
{
	//adapter.log.debug('State of ' + node + ' has changed ' + JSON.stringify(state) + '.');
	var action = node.substr(node.lastIndexOf('.')+1);
	
	if (listeners.indexOf(action) > -1 && state.ack !== true)
	{
		adapter.log.info('Triggered action -' + action + '- on Roomba.');
		robot[action]();
	}
});