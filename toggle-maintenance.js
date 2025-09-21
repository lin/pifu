#!/usr/bin/env node

/**
 * Maintenance Mode Toggle Script
 * Simple command-line tool to enable/disable maintenance mode
 * 
 * Usage:
 *   node toggle-maintenance.js enable
 *   node toggle-maintenance.js disable
 *   node toggle-maintenance.js status
 */

const fs = require('fs');
const path = require('path');

const MAINTENANCE_FILE = path.join(__dirname, 'maintenance.json');

function loadMaintenanceConfig() {
    try {
        const data = fs.readFileSync(MAINTENANCE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading maintenance config:', error.message);
        process.exit(1);
    }
}

function saveMaintenanceConfig(config) {
    try {
        config.lastUpdated = new Date().toISOString();
        fs.writeFileSync(MAINTENANCE_FILE, JSON.stringify(config, null, 2));
        console.log('Maintenance configuration updated successfully.');
    } catch (error) {
        console.error('Error saving maintenance config:', error.message);
        process.exit(1);
    }
}

function enableMaintenance() {
    const config = loadMaintenanceConfig();
    config.enabled = true;
    saveMaintenanceConfig(config);
    console.log('✅ Maintenance mode ENABLED');
    console.log('   Website is now unavailable to users');
}

function disableMaintenance() {
    const config = loadMaintenanceConfig();
    config.enabled = false;
    saveMaintenanceConfig(config);
    console.log('✅ Maintenance mode DISABLED');
    console.log('   Website is now available to users');
}

function showStatus() {
    const config = loadMaintenanceConfig();
    const status = config.enabled ? 'ENABLED' : 'DISABLED';
    const statusColor = config.enabled ? '🔴' : '🟢';
    
    console.log(`${statusColor} Maintenance mode: ${status}`);
    console.log(`   Message: ${config.message}`);
    console.log(`   Estimated return time: ${config.estimatedReturnTime}`);
    console.log(`   Password: ${config.password ? '***' + config.password.slice(-3) : 'Not set'}`);
    console.log(`   Password hint: ${config.passwordHint || 'Not set'}`);
    console.log(`   Last updated: ${new Date(config.lastUpdated).toLocaleString()}`);
}

function setPassword() {
    const newPassword = process.argv[3];
    if (!newPassword) {
        console.error('❌ Please provide a password. Usage: node toggle-maintenance.js set-password <password>');
        process.exit(1);
    }
    
    const config = loadMaintenanceConfig();
    config.password = newPassword;
    saveMaintenanceConfig(config);
    console.log('✅ Password updated successfully');
    console.log(`   New password: ***${newPassword.slice(-3)}`);
}

function setPasswordHint() {
    const newHint = process.argv[3];
    if (!newHint) {
        console.error('❌ Please provide a password hint. Usage: node toggle-maintenance.js set-hint "<hint>"');
        process.exit(1);
    }
    
    const config = loadMaintenanceConfig();
    config.passwordHint = newHint;
    saveMaintenanceConfig(config);
    console.log('✅ Password hint updated successfully');
    console.log(`   New hint: ${newHint}`);
}

function showHelp() {
    console.log(`
Maintenance Mode Toggle Script

Usage:
  node toggle-maintenance.js <command> [options]

Commands:
  enable              Enable maintenance mode (make website unavailable)
  disable             Disable maintenance mode (make website available)
  status              Show current maintenance mode status
  set-password <pwd>  Set the bypass password
  set-hint "<hint>"   Set the password hint message
  help                Show this help message

Examples:
  node toggle-maintenance.js enable
  node toggle-maintenance.js disable
  node toggle-maintenance.js status
  node toggle-maintenance.js set-password mypassword123
  node toggle-maintenance.js set-hint "Contact admin@example.com for access"
`);
}

// Main execution
const command = process.argv[2];

switch (command) {
    case 'enable':
        enableMaintenance();
        break;
    case 'disable':
        disableMaintenance();
        break;
    case 'status':
        showStatus();
        break;
    case 'set-password':
        setPassword();
        break;
    case 'set-hint':
        setPasswordHint();
        break;
    case 'help':
    case '--help':
    case '-h':
        showHelp();
        break;
    default:
        console.error('❌ Invalid command. Use "help" to see available commands.');
        showHelp();
        process.exit(1);
}