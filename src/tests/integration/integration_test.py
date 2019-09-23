"""Integration tests"""
import json
import logging
import unittest
import yaml

from prance import ResolvingParser

import utils


class IntegrationTests(utils.UtilsTestCase):
    """Integration tests class"""

    @classmethod
    def setup(cls, config_path, openapi_path):
        """Performs basic setup"""

        with open(config_path) as config_file:
            config = json.load(config_file)
            cls.base_url = utils.setup_base_url(config)
            cls.session = utils.setup_session(config)
            cls.test_cases = config['test_cases']
            cls.local_test = config['local_test']

        with open(openapi_path) as openapi_file:
            openapi = yaml.load(openapi_file, Loader=yaml.SafeLoader)
            if 'swagger' in openapi:
                backend = 'flex'
            elif 'openapi' in openapi:
                backend = 'openapi-spec-validator'
            else:
                exit('Error: could not determine openapi document version')

        parser = ResolvingParser(openapi_path, backend=backend)
        cls.openapi = parser.specification

    @classmethod
    def tearDownClass(cls):
        cls.session.close()

    def check_terms(
        self,
        endpoint,
        query_params=None,
        resource='TermResource',
        response_code=200
    ):
        nullable_fields = [
            'description',
            'season',
            'calendarYear',
            'academicYear',
            'financialAidYear',
            'startDate',
            'endDate',
            'housingStartDate',
            'housingEndDate',
            'registrationStartDate',
            'registrationEndDate',
            'status',
        ]
        return self.check_endpoint(
            endpoint,
            resource,
            response_code,
            query_params,
            nullable_fields=nullable_fields
        )

    def check_filter_equal(self, resources, attribute):
        test_cases = set(filter(
            lambda x: x is not None,
            map(
                lambda x: x['attributes'][attribute],
                resources
            )
        ))
        logger.info(f'{attribute} test cases: {test_cases}')
        for test_case in test_cases:
            filtered_response = self.check_terms(
                '/terms',
                {attribute: test_case}
            )
            for filtered_resource in filtered_response.json()['data']:
                self.assertEqual(
                    filtered_resource['attributes'][attribute],
                    test_case
                )

    def check_filter_date(self, resources, attribute):
        start_attributes = {
            'date': 'startDate',
            'housingDate': 'housingStartDate',
            'registrationDate': 'registrationStartDate'
        }
        end_attributes = {
            'date': 'endDate',
            'housingDate': 'housingEndDate',
            'registrationDate': 'registrationEndDate'
        }
        test_cases = set(filter(
            lambda x: x is not None,
            map(
                lambda x: x['attributes'][start_attributes[attribute]],
                resources
            )
        ))
        logger.info(f'{attribute} test cases: {test_cases}')
        for test_case in test_cases:
            filtered_response = self.check_terms(
                '/terms',
                {attribute: test_case}
            )
            for filtered_resource in filtered_response.json()['data']:
                self.assertGreaterEqual(
                    test_case,
                    filtered_resource['attributes']
                                     [start_attributes[attribute]]
                )
                self.assertLessEqual(
                    test_case,
                    filtered_resource['attributes'][end_attributes[attribute]]
                )

    def test_get_terms(self):
        response = self.check_terms('/terms')
        resources = response.json()['data']
        if not resources:
            self.fail('No terms found')

        with self.subTest('filter academicYear'):
            self.check_filter_equal(resources, 'academicYear')
        with self.subTest('filter calendarYear'):
            self.check_filter_equal(resources, 'calendarYear')
        with self.subTest('filter financialAidYear'):
            self.check_filter_equal(resources, 'financialAidYear')
        with self.subTest('filter date'):
            self.check_filter_date(resources, 'date')
        with self.subTest('filter housingDate'):
            self.check_filter_date(resources, 'housingDate')
        with self.subTest('filter registrationDate'):
            self.check_filter_date(resources, 'registrationDate')


if __name__ == '__main__':
    arguments, argv = utils.parse_arguments()

    # Setup logging level
    if arguments.debug:
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    IntegrationTests.setup(arguments.config_path, arguments.openapi_path)
    unittest.main(argv=argv)
