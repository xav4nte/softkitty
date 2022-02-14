'use strict';

// Const electron = require('electron');
// const app = electron.app;
const path = require('path');
const os = require('os');
const ElectronPreferences = require('electron-preferences');

const preferences = new ElectronPreferences({
	css: 'custom-style.css',
	dataStore: path.resolve(__dirname, 'omnilog.preferences.json'),
	defaults: {
		server: {
			listeningport: '9999'
		},
		general:{
			fontfamily: "Consolas, 'Courier New', monospace",
			fontsize: '13'
		}
		// ...
	},
	debug: false, //true will open the dev tools
	webPreferences: {
		webSecurity: true,
		nodeIntegration: true		
	},
	browserWindowOverrides: {
		title: 'Preferences',
	},
	sections: [
		{
			'id': 'general',
			'label': 'General',
			/**
			 * See the list of available icons below.
			 */
			'form': {
				'groups': [
					{
						/**
						 * Group heading is optional.
						 */
						'label': 'General',
						'fields': [
							{
								label: 'Font family',
								key: 'fontfamily',
								type: 'text',
								help: 'Controls the font family'
							},
							{
								label: 'Font size',
								key: 'fontsize',
								type: 'text',
								help: 'Controls the font size in pixels',
								inputType: 'number'
							}							
                        ]
                    }
                ]
            }
        },		
		{				
			id: 'server',
			label: 'Servers',
			form: {
				groups: [
					{
						label: 'Server settings',
						fields: [
							{
								label: 'Listening port',
								key: 'listeningport',
								type: 'text',
								inputType: 'number'
							}
						],
					},				
				],
			},
		}
	],
});

module.exports = preferences;