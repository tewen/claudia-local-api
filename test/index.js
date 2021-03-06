'use strict';

const expect = require('chai').expect;
const request = require('request');
const rewire = require('rewire');
const sinon = require('sinon');

const localApi = rewire('../lib');

describe('Unit tests for lib/index', function () {
    context('Testing getDefaultConfig', function () {
        it('CASE 1: Should return required fields for default config', function () {
            const getDefaultConfig = localApi.__get__('getDefaultConfig');

            const result = getDefaultConfig();

            expect(result).to.have.keys('port');
        });
    });

    context('Testing logJson', function () {
        it('CASE 1: Should log result as expected', function () {
            const logJson = localApi.__get__('logJson');
            const spy = sinon.spy();
            const logger = {
                info: spy
            };
            const body = {
                a: {
                    b: {
                        c: [1, 2, 3],
                        d: 42
                    }
                },
                e: 42
            };
            const expectedResult = JSON.stringify(body, null, 4);

            const result = logJson(logger, body);

            expect(result).to.be.eq(undefined);
            expect(spy.calledOnce).to.be.eql(true);
            expect(spy.calledWith(expectedResult)).to.be.eql(true);
        });
    });

    context('Testing logError', function () {
        it('CASE 1: Should log error as expected', function () {
            const logError = localApi.__get__('logError');
            const spy = sinon.spy();
            const logger = {
                error: spy
            };
            const error = new Error('Fail!');
            const expectedResult = error.stack;

            const result = logError(logger, error);

            expect(result).to.be.eq(undefined);
            expect(spy.calledOnce).to.be.eql(true);
            expect(spy.calledWith(expectedResult)).to.be.eql(true);
        });
    });

    context('Testing getParams', function () {
        it('CASE 1: Should make claudia-api-builder request params as expected', function () {
            const getParams = localApi.__get__('getParams');
            const req = {
                originalUrl: 'http://www.example.com/test?test-value=42',
                method: 'PATCH',
                headers: {
                    'content-type': 'application/json',
                    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36'
                },
                query: {
                    'test-value': '42'
                },
                body: {
                    a: {
                        b: {
                            c: [1, 2, 3],
                            d: 42
                        }
                    },
                    e: 42
                }
            };
            const expectedResult = {
                requestContext: {
                    resourcePath: req.originalUrl,
                    httpMethod: req.method
                },
                headers: req.headers,
                queryStringParameters: req.query,
                body: req.body
            };

            const result = getParams(req);

            expect(result).to.deep.eql(expectedResult);
        });
    });

    context('Testing makeHandleResponse', function () {
        function getRes(expectedHeaders, expectedStatusCode, expectedBody) {
            return {
                set: function (headers) {
                    expect(headers).to.deep.eql(expectedHeaders);
                    return this;
                },

                status: function (statusCode) {
                    expect(statusCode).to.be.eql(expectedStatusCode);
                    return this;
                },

                send: function (body) {
                    expect(body).to.deep.eql(expectedBody);
                    return this;
                }
            };
        }

        it('CASE 1: Should handle successful response', function () {
            const makeHandleResponse = localApi.__get__('makeHandleResponse');
            const spy = sinon.spy();
            const logger = {
                info: spy
            };
            const response = {
                headers: {
                    'content-type': 'application/json',
                    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36'
                },
                statusCode: 201,
                body: {
                    a: {
                        b: {
                            c: [1, 2, 3],
                            d: 42
                        }
                    },
                    e: 42
                }
            };
            const res = getRes(response.headers, response.statusCode, response.body);
            const expectedResult = JSON.stringify(response, null, 4);

            const handleResponse = makeHandleResponse(logger, res);
            handleResponse(null, response);

            expect(spy.calledOnce).to.be.eql(true);
            expect(spy.calledWith(expectedResult)).to.be.eql(true);
        });

        it('CASE 2: Should handle successful response with default values', function () {
            const makeHandleResponse = localApi.__get__('makeHandleResponse');
            const spy = sinon.spy();
            const logger = {
                info: spy
            };
            const response = {};
            const res = getRes({}, 200, {});
            const expectedResult = JSON.stringify(response, null, 4);

            const handleResponse = makeHandleResponse(logger, res);
            handleResponse(null, response);

            expect(spy.calledOnce).to.be.eql(true);
            expect(spy.calledWith(expectedResult)).to.be.eql(true);
        });

        it('CASE 3: Should handle error response', function () {
            const makeHandleResponse = localApi.__get__('makeHandleResponse');
            const spy = sinon.spy();
            const logger = {
                error: spy
            };
            const error = new Error('Fail');
            const res = getRes({}, 500, {
                message: error.message
            });
            const expectedResult = error.stack;

            const handleResponse = makeHandleResponse(logger, res);
            handleResponse(error, {});

            expect(spy.calledOnce).to.be.eql(true);
            expect(spy.calledWith(expectedResult)).to.be.eql(true);
        });
    });

    context('Testing makeHandleRequest', function () {
        it('CASE 1: Should handle request correctly', function () {
            const makeHandleRequest = localApi.__get__('makeHandleRequest');
            const spy = sinon.spy();
            const logger = {
                info: spy
            };
            const req = {
                originalUrl: 'http://www.example.com/test?test-value=42',
                method: 'PATCH',
                headers: {
                    'content-type': 'application/json',
                    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36'
                },
                query: {
                    'test-value': '42'
                },
                body: {
                    a: {
                        b: {
                            c: [1, 2, 3],
                            d: 42
                        }
                    },
                    e: 42
                }
            };
            const expectedParams = {
                requestContext: {
                    resourcePath: req.originalUrl,
                    httpMethod: req.method
                },
                headers: req.headers,
                queryStringParameters: req.query,
                body: req.body
            };
            const app = {
                proxyRouter: function (params, controlFlow) {
                    expect(params).to.deep.eql(expectedParams);
                    expect(controlFlow).to.have.keys('done');
                    expect(controlFlow.done).to.be.a('function');
                }
            };

            const handleRequest = makeHandleRequest(logger, app);
            const result = handleRequest(req, {});

            expect(result).to.be.eql(undefined);
        });
    });

    context('Testing bootstrap', function () {
        it('CASE 1: Should be able to bootstrap a server', function () {
            const bootstrap = localApi.__get__('bootstrap');
            const options = {
                port: 42
            };
            const server = {
                all: function (route, handler) {
                    expect(route).to.be.eql('*');
                    expect(handler).to.be.a('function');
                },
                listen: function (port) {
                    expect(port).to.be.eql(options.port);
                }
            };
            const spy = sinon.spy();
            const logger = {
                info: spy
            };
            const claudiaApp = {};

            const result = bootstrap(server, logger, claudiaApp, options);

            expect(result).to.be.eql(undefined);
            expect(spy.calledOnce).to.be.eql(true);
        });
    });

    context('Testing runCmd', function () {
        it('CASE 1: Should be able to process command line arguments', function () {
            const runCmd = localApi.__get__('runCmd');
            const apiModule = 'test/claudia_app';
            const port = 3001;
            process.argv = [
                'node',
                'claudia-local-api',
                '--api-module',
                apiModule,
                '--port',
                String(port)
            ];
            const bootstrap = function (server, logger, claudiaApp, options) {
                expect(server).to.be.a('function');
                expect(logger).to.be.a('object');
                expect(claudiaApp).to.be.a('object');
                expect(options.apiModule).to.be.eql(apiModule);
                expect(options.port).to.be.eql(String(port));
            };

            const result = runCmd(bootstrap);

            expect(result).to.be.eql(undefined);
        });

        it('CASE 2: Should be able to set default value for port', function () {
            const runCmd = localApi.__get__('runCmd');
            const apiModule = 'test/claudia_app';
            const port = 3000;
            process.argv = [
                'node',
                'claudia-local-api',
                '--api-module',
                apiModule
            ];
            const bootstrap = function (server, logger, claudiaApp, options) {
                expect(server).to.be.a('function');
                expect(logger).to.be.a('object');
                expect(claudiaApp).to.be.a('object');
                expect(options.apiModule).to.be.eql(apiModule);
                expect(options.port).to.be.eql(port);
            };

            const result = runCmd(bootstrap);

            expect(result).to.be.eql(undefined);
        });
    });
});

describe('Integration tests for lib/index', function () {
    const port = 3000;
    const spy = sinon.spy();

    before(function () {
        const initServer = localApi.__get__('initServer');
        const bootstrap = localApi.__get__('bootstrap');
        const logger = {
            info: spy
        };
        const claudiaApp = require('./claudia_app');
        const options = {
            port
        };
        const server = initServer();

        this.app = bootstrap(server, logger, claudiaApp, options);
    });

    after(function () {
        this.app.close();
    });

    function makeRequest(params) {
        return new Promise(function (resolve, reject) {
            return request(params, function (err, headers, body) {
                if (err) {
                    return reject(err);
                } else if ([200, 201, 204].indexOf(headers.statusCode) === -1) {
                    return reject(new Error(`Received statusCode = ${headers.statusCode}`));
                }
                return resolve({headers, body});
            });
        });
    }

    it('CASE 1: Should handle request and response correctly for GET request', function () {
        const params = {
            url: `http://localhost:${port}`,
            method: 'GET'
        };
        return makeRequest(params)
            .then(function (result) {
                const headers = result.headers;
                const body = result.body;

                expect(headers.statusCode).to.be.eql(200);
                expect(headers.headers.called).to.be.eql('handleGetRequest');
                expect(body).to.be.eql(JSON.stringify('OK'));
            });
    });

    it('CASE 2: Should handle request and response correctly for POST request', function () {
        const params = {
            url: `http://localhost:${port}`,
            method: 'POST'
        };
        return makeRequest(params)
            .then(function (result) {
                const headers = result.headers;
                const body = result.body;

                expect(headers.statusCode).to.be.eql(201);
                expect(headers.headers.called).to.be.eql('handlePostRequest');
                expect(body).to.be.eql(JSON.stringify('OK'));
            });
    });
});
