from django.test import LiveServerTestCase
import unittest
import json
import requests
from constants import NODE_HOSTNAMES
import inspect


class TestLogon(LiveServerTestCase):

    def setUp(self):
        unittest.TestCase.setUp(self)
        self.username = 'https://pcmdi.llnl.gov/esgf-idp/openid/acmetest'
        self.password = 'ACM#t3st'

    def test_logon_success(self):
        print "\n---->[+] Starting " + inspect.stack()[0][3]
        credential = {
            'username': self.username,
            'password': self.password
        }
        response_code = requests.get(self.live_server_url + '/acme/esgf/logon/', params=credential).status_code
        self.assertTrue( response_code == 200)

    def test_logon_fail(self):
        print "\n---->[+] Starting " + inspect.stack()[0][3]
        print "____ this should print a stack trace ________"
        print "--------------------------------------------"
        credential = {
            'username': 'http://abra',
            'password': 'cadabra'
        }
        response_code = requests.get(self.live_server_url + '/acme/esgf/logon/', params=credential).status_code
        self.assertFalse( response_code == 200)

    def test_logon_fail_no_user(self):
        print "\n---->[+] Starting " + inspect.stack()[0][3]
        print "--------------------------------------------"
        credential = {
            'asdf': 'http://abra',
            'fdsa': 'cadabra'
        }
        response_code = requests.get(self.live_server_url + '/acme/esgf/logon/', params=credential).status_code
        self.assertTrue( response_code == 403)

    def test_logon_fail_no_pass(self):
        print "\n---->[+] Starting " + inspect.stack()[0][3]
        print "--------------------------------------------"
        credential = {
            'username': 'http://abra',
            'fdsa': 'cadabra'
        }
        response_code = requests.get(self.live_server_url + '/acme/esgf/logon/', params=credential).status_code
        self.assertTrue( response_code == 403)


class TestLoadFacet(LiveServerTestCase):

    def test_load_facet_success(self):
        print "\n---->[+] Starting " + inspect.stack()[0][3]
        data = json.dumps(NODE_HOSTNAMES[0:1])
        response = requests.get(self.live_server_url + '/acme/esgf/load_facets/', params={'nodes': data})
        self.assertTrue( response.status_code == 200 )

    def test_load_facet_failure(self):
        print "\n---->[+] Starting " + inspect.stack()[0][3]
        print "____ this should print a stack trace ________"
        print "--------------------------------------------"
        data = json.dumps(['this', 'is', 'not', 'a', 'hostname'])
        response = requests.get(self.live_server_url + '/acme/esgf/load_facets/', params={'nodes': data})
        self.assertFalse( response.status_code == 200 )


class TestNodeSearch(LiveServerTestCase):

    def setUp(self):
        self.valid_nodes = NODE_HOSTNAMES[0:1]
        self.invalid_nodes = ['not.a.node.gov', 'also.not.a.node.gov']
        self.valid_terms = {'project': 'ACME'}
        self.invalid_terms = {'not_a_valid': 'search_term'}

    def test_node_search_success(self):
        print "\n---->[+] Starting " + inspect.stack()[0][3]
        params = {
            'searchString': json.dumps(self.valid_terms),
            'nodes': json.dumps(self.valid_nodes)
        }
        response = requests.get(self.live_server_url + '/acme/esgf/node_search/', params=params)
        self.assertTrue( response.status_code == 200 )
        self.assertTrue( len(response.content) > 100 )
    # 
    # def test_node_search_no_node(self):
    #     print "\n---->[+] Starting " + inspect.stack()[0][3]
    #     params = {
    #         'searchString': json.dumps(self.valid_terms),
    #         'asdf': json.dumps(self.valid_nodes)
    #     }
    #     response = requests.get(self.live_server_url + '/acme/esgf/node_search/', params=params)
    #     self.assertTrue( response.status_code == 400 )
    #     self.assertTrue( len(response.content) < 100 )

    def test_node_search_bad_node(self):
        print "\n---->[+] Starting " + inspect.stack()[0][3]
        print "____ this should print a stack trace ________"
        print "--------------------------------------------"
        request = json.dumps({
            'nodes': self.invalid_nodes,
            'terms': self.valid_terms
        })
        response = requests.get(self.live_server_url + '/acme/esgf/node_search/', params={'searchString':request})
        self.assertFalse( response.status_code == 200 )
        self.assertFalse( len(response.content) > 100 )

    def test_node_search_bad_term(self):
        print "\n---->[+] Starting " + inspect.stack()[0][3]
        print "____ this should print a stack trace ________"
        print "--------------------------------------------"
        request = json.dumps({
            'nodes': self.valid_nodes,
            'terms': self.invalid_terms
        })
        response = requests.get(self.live_server_url + '/acme/esgf/node_search/', params={'searchString':request})
        self.assertFalse( response.status_code == 200 )
        self.assertFalse( len(response.content) > 100 )


class TestNodeList(LiveServerTestCase):

    def test_get_node_list(self):
        print "\n---->[+] Starting " + inspect.stack()[0][3]
        response = requests.get(self.live_server_url + '/acme/esgf/node_list')
        self.assertTrue( response.status_code == 200 )
        self.assertTrue( 'pcmdi.llnl.gov' in json.loads(response.content) )


class TestDownload(LiveServerTestCase):

    def setUp(self):
        self.auth_url = 'http://aims3.llnl.gov/thredds/fileServer/cmip5_css01_data/cmip5/output1/LASG-CESS/FGOALS-g2/midHolocene/day/seaIce/day/r1i1p1/v1/usi/usi_day_FGOALS-g2_midHolocene_r1i1p1_05320101-05321231.nc'
        self.unauth_url = 'http://airsl2.gesdisc.eosdis.nasa.gov/thredds/fileServer/cmac/taNobs_AIRS_L3_RetStd-v6_201502.nc'
        self.bad_url = 'http://not.a.site.llnl.gov/not_a_file.nc'

    def test_download_unauth(self):
        print "\n---->[+] Starting " + inspect.stack()[0][3]
        response = requests.get(self.live_server_url + '/acme/esgf/download', params={'url': self.unauth_url})
        self.assertTrue( response.status_code == 200 )

    def test_download_bad_url(self):
        print "\n---->[+] Starting " + inspect.stack()[0][3]
        response = requests.get(self.live_server_url + '/acme/esgf/download', params={'url': self.bad_url})
        self.assertTrue( response.status_code == 400 )

    # TODO: make this work
    # def test_download_auth(self):
    #     print "\n---->[+] Starting " + inspect.stack()[0][3]
    #     response = requests.get(self.live_server_url + '/acme/esgf/download', params={'url': self.auth_url})
    #     self.assertTrue( response.status_code == 200 )
