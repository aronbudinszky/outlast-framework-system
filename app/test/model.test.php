<?php
	/**
	 * A standard unit test for Outlast Framework models
	 * @todo Fix so that these tests do not fail if db is disabled.
	 **/
	class OfwModelTest extends zajTest {

		/* @var Category $category */
		public $category;

		/**
		 * Set up stuff.
		 **/
		public function setUp(){
			// Disabled if mysql not enabled
				if(!$this->zajlib->zajconf['mysql_enabled']) return false;
			// Create a mock category object
				$this->category = Category::create('mockid');
				$this->category->set('name', 'mock!');
				$this->category->set('description', 'mymockdesc');
				$this->category->save();
		}

		/**
		 * Verify that I could indeed save stuff
		 */
		public function system_verify_if_save_was_successful(){
			// Disabled if mysql not enabled
				if(!$this->zajlib->zajconf['mysql_enabled']) return false;
			// Fetch and test!
				$cat = Category::fetch('mockid');
				zajTestAssert::areIdentical('mock!', $cat->name);
				zajTestAssert::areIdentical('mockid', $cat->id);
		}


		/**
		 * Check the duplication feature
		 */
		public function system_check_duplication_feature(){
			// Disabled if mysql not enabled
				if(!$this->zajlib->zajconf['mysql_enabled']) return false;
			// Let's try to duplicate the Category object
				$cat = $this->category->duplicate('mock2');
				$cat->save();
			// Now verify if it has the same info
				$cat = Category::fetch('mock2');
				zajTestAssert::areIdentical('mock!', $cat->name);
				zajTestAssert::areIdentical('mock2', $cat->id);
				zajTestAssert::areNotIdentical($this->category->id, $cat->id);
			// The order number of mock2 should be greater than that of mockid
				zajTestAssert::areNotIdentical($this->category->data->ordernum, $cat->data->ordernum);
		}

		/**
		 * Let's test model extensions (and dynamic plugin loading)
		 */
		public function system_check_model_extending(){
			// Disabled if mysql not enabled
				if(!$this->zajlib->zajconf['mysql_enabled']) return false;
			// Load up my _test plugin (if not already done)
				$load_test = $this->zajlib->plugin->load('_test', true, true);
				zajTestAssert::areIdentical('__plugin working!', $load_test);
			// Let's try some OfwTest action before it is extended!
				$result = OfwTest::just_a_test_static();
				zajTestAssert::areIdentical('just_a_test_static', $result);
				$ofwtest = OfwTest::create();
				$result = $ofwtest->just_a_test();
				zajTestAssert::areIdentical('just_a_test', $result);
			// Let's try some File action! But first run the autoload manually...
				// @todo When dynamically loading models, plugin/load should check to see if any overriding models are introduced - these need to load up
				include $this->zajlib->basepath.'system/plugins/_test/model/file.model.php';
				$result = File::just_a_test_static();
				zajTestAssert::areIdentical('just_a_test_static', $result);
				$filetest = File::create();
				$result = $filetest->just_a_test();
				zajTestAssert::areIdentical('just_a_test', $result);

            // Test db fetching
                $f = File::create();
                $f->set('name', 'Test file')->save();

                /** @var File|FileTest $f2 */
                $f2 = File::fetch($f->id);
                $f2->just_a_test();
				zajTestAssert::areIdentical('just_a_test', $result);
				



			// Now dynamically extend OfwTest and see what happens
				OfwTestExt::extend('OfwTest');
				$result = OfwTest::only_in_ext_static();
			// Call stuff only in extension
				zajTestAssert::areIdentical('only_in_ext_static', $result);
				$result = OfwTest::just_a_test_static();
				zajTestAssert::areIdentical('just_a_test_static', $result);
				$ofwtest2 = OfwTest::create();
				$result = $ofwtest2->only_in_ext();
				zajTestAssert::areIdentical('only_in_ext', $result);
				$result = $ofwtest2->just_a_test();
				zajTestAssert::areIdentical('just_a_test_extended', $result);
			// Now call stuff that is NOT in extension but only in parent
				$result = OfwTest::only_in_parent_static();
				zajTestAssert::areIdentical('only_in_parent_static', $result);
				$result = $ofwtest2->only_in_parent();
				zajTestAssert::areIdentical('only_in_parent', $result);
			return true;
		}

        /**
         * Check conversion to array / json
         */
        public function system_check_model_to_array(){
            $f = File::create();
            $f->set('name', 'Test file')->save();

            // Test to array
            $a1 = $f->to_array();
            zajTestAssert::areIdentical( 'Test file', $a1['name']->__toString());
            zajTestAssert::areIdentical( $f->id, $a1['id']->__toString());

            $a2 = $f->to_array(false);
            zajTestAssert::areIdentical( 'Test file', $a2['name']);
            zajTestAssert::areIdentical( $f->id, $a2['id']);

            $a2 = $f->to_array(false, ['name']);
            zajTestAssert::areIdentical( 'Test file', $a2['name']);
            zajTestAssert::isNull($a2['id']);

            // Test to json
            $j1 = $f->to_json(false, ['name']);
            zajTestAssert::areIdentical('{"name":"Test file"}', $j1);
            $j2 = $f->to_json();
            $j2decoded = json_decode($j2);
            zajTestAssert::areIdentical('Test file', $j2decoded->name);
            zajTestAssert::areIdentical($f->id, $j2decoded->id);

        }

		/**
		 * Reset stuff, cleanup.
		 **/
		public function tearDown(){
			// Disabled if mysql not enabled
				if(!$this->zajlib->zajconf['mysql_enabled']) return false;
			// Remove all of my tests
				Category::delete_tests();
				File::delete_tests();
			return true;
		}

	}