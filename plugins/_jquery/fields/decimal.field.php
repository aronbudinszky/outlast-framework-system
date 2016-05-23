<?php
/**
 * Field definition for a number which is an integer.
 * @package Fields
 * @subpackage BuiltinFields
 **/
class zajfield_decimal extends zajField {
	// name, options - these are passed to constructor and available here!
	const in_database = true;		// boolean - true if this field is stored in database		
	const use_validation = false;	// boolean - true if data should be validated before saving
	const use_get = false;			// boolean - true if preprocessing required before getting data
	const use_save = false;			// boolean - true if preprocessing required before saving data
	const use_duplicate = true;		// boolean - true if data should be duplicated when duplicate() is called
	const use_filter = false;		// boolean - true if fetch is modified
	const disable_export = false;	// boolean - true if you want this field to be excluded from exports
	const search_field = false;		// boolean - true if this field is used during search()
	const edit_template = 'field/integer.field.html';	// string - the edit template, false if not used
	const show_template = false;	// string - used on displaying the data via the appropriate tag (n/a)

	// Construct
	public function __construct($name, $options, $class_name, &$zajlib){
		// set default options
		// no default options
		// call parent constructor
		parent::__construct(__CLASS__, $name, $options, $class_name, $zajlib);
	}

	/**
	 * Defines the structure and type of this field in the mysql database.
	 * @return array Returns in array with the database definition.
	 **/
	public function database(){
		// Defaults to 0, but use default() if given
		$length = 10;
		$scale = 0;
		$comment = 'decimal field';
		if(!empty($this->options['default'])) $default = $this->options['default'];
		// Length
		if(!empty($this->options['length']) && is_numeric($this->options['length'])){
			$length = $this->options['length'];
			$comment .= ' with length of '.$length;
		}
		// Decimals
		if(!empty($this->options['scale']) && $this->options['scale'] && is_numeric($this->options['scale'])){
			$scale = $this->options['scale'];
			$comment .= ' and with '.$scale.' scale';
		}

		// define each field
		$fields[$this->name] = array(
			'field' => $this->name,
			'type' => 'decimal',
			'key' => '',
			'option' => array(
				0 => $length,
				1 => $scale
			),
			'default' => '0',
			'extra' => '',
			'comment'=> $comment
		);
		return $fields;
	}

	/**
	 * Check to see if input data is valid.
	 * @param mixed $input The input data.
	 * @return boolean Returns true if validation was successful, false otherwise.
	 **/
	public function validation($input){
		return true;
	}

	/**
	 * Preprocess the data before returning the data from the database.
	 * @param mixed $data The first parameter is the input data.
	 * @param zajModel $object This parameter is a pointer to the actual object which is being modified here.
	 * @return mixed Return the data that should be in the variable.
	 **/
	public function get($data, &$object){
		return $data;
	}

	/**
	 * Preprocess the data before saving to the database.
	 * @param mixed $data The first parameter is the input data.
	 * @param zajModel $object This parameter is a pointer to the actual object which is being modified here.
	 * @return array Returns an array where the first parameter is the database update, the second is the object update
	 * @todo Fix where second parameter is actually taken into account! Or just remove it...
	 **/
	public function save($data, &$object){
		return $data;
	}

}