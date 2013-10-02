<?php
/**
 * A collection of functions for checking plugin load status. This is useful during init of your application to make sure plugins are enabled and/or loaded in the proper order.
 *
 * @author Aron Budinszky <aron@mozajik.org>
 * @version 3.0
 * @package Library
 **/

class zajlib_plugin extends zajLibExtension {

	/**
	 * Checks to see if a plugin is enabled.
	 * @param string $name The name of the plugin.
	 * @return boolean Returns true if the plugin is enabled, false otherwise.
	 **/
	public function is_enabled($name){
		return in_array($name, $this->get_plugins());
	}
	
	/**
	 * Checks to see if a plugin is loaded. This is different from enabled, because at a certain point a specific plugin might not yet be loaded even though it is enabled. This is useful if plugin load order is important.
	 * @param string $name The name of the plugin.
	 * @return boolean Returns true if the plugin is loaded, false otherwise.
	 **/
	public function is_loaded($name){
		return in_array($name, $this->zajlib->loaded_plugins);
	}

	/**
	 * Gets an array of plugins. You can get system plugins (ones in the /system/ folder) or app plugins (ones in the /plugins/ folder).
	 * @param string $type This can be 'system', 'app', or 'all' (default) depending on which you want to retrieve.
	 * @return array Returns an array of plugin names that are currently enabled.
	 **/
	public function get_plugins($type = "all|app|system"){
		if($type == 'app') return $this->zajlib->zajconf['plugin_apps'];
		if($type == 'system') return $this->zajlib->zajconf['system_apps'];
		return $this->zajlib->array->merge($this->zajlib->zajconf['plugin_apps'], $this->zajlib->zajconf['system_apps']);
	}

	/**
	 * Dynamically load a plugin.
	 * @param string $plugin The name of the plugin to be loaded.
	 * @param boolean $load_function If set to true (the default) the __plugin function will be called once the plugin is loaded (this is where you can init the plugin).
	 * @param boolean $system_plugin Set to true if you want to load it as a system plugin.
	 * @return boolean Returns true if the plugin was loaded successfully, false otherwise. In case of failure, a warning will also be issued.
	 * @todo Make sure all plugin loading happens via this function.
	 **/
	public function load($plugin, $load_function = true, $system_plugin = false){
		// Disable double loading
			if($this->is_loaded($plugin)) return true;
		// Result defaults to true
			$result = true;
		// Add the new plugin to the front of the assoc array
			if($system_plugin){
				$this->zajlib->zajconf['system_apps'] = array_merge(array($plugin=>$plugin), $this->zajlib->zajconf['system_apps']);
				$pluginbasepath = $this->zajlib->basepath.'system/plugins/';
			}
			else{
				$this->zajlib->loaded_plugins = array_merge(array($plugin=>$plugin), $this->zajlib->loaded_plugins);
				$pluginbasepath = $this->zajlib->basepath.'plugins/';
			}
		// only do this if either default controller exists in the plugin folder
			if($load_function && file_exists($pluginbasepath.$plugin.'/controller/'.$plugin.'.ctl.php') || file_exists($pluginbasepath.$plugin.'/controller/'.$plugin.'/default.ctl.php')){
				// reroute but if no __plugin method, just skip without an error message (TODO: maybe remove the false here?)!
					$result = $this->zajlib->reroute($plugin.'/__plugin/', array($this->zajlib->app.$this->zajlib->mode, $this->zajlib->app, $this->zajlib->mode), false);
				// unload the plugin if the result is explicitly false
					if($result === false) $this->unload($plugin);
			}
		return $result;
	}

	/**
	 * Dynamically unload a plugin.
	 * @param string $plugin The name of the plugin to be unloaded.
	 * @return boolean Returns true if the plugin was unloaded successfully, false if no such plugin was yet loaded.
	 * @todo Implement this properly!
	 */
	public function unload($plugin){
		// Check to see if plugin loaded
			if(!$this->is_loaded($plugin)) return false;
		// Unload plugin and return true
			unset($this->zajlib->loaded_plugins[$plugin]);		
	}
}