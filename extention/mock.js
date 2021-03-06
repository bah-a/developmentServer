const utils = require('../utils');

/**
 * HTTP mock
 * 
 * @param {any} app
 * @param {any} config
 * @param {any} environment
 */
module.exports = exports = (app, server, config, environment) => {
    if (utils.isUndefined(config.mock) || utils.isUndefined(config.mock.http)) {
        environment.log('[devServer] http mock is undefine.');
        return;
    }

    const http = config.mock.http,
        keys = Object.keys(http),
        processors = utils.importProcessors(config);
    let {
        onResult
    } = http;

    keys.forEach(path => {
        const api = http[path],
            method = getMethod(api.method);

        app[method](path, (req, res, next) => {
            const resultHandler = onResult || api.onResult;
            if (utils.isFunction(api.onResponse)) {
                api.onResponse(api, resultHandler, environment, req, res, next);
            } else if (api.type && processors[api.type]) {
                processors[api.type](api, resultHandler, environment, true, req, res, next);
            } else {
                defaultProcessor(api, resultHandler, environment, req, res, next);
            }
        });
    });
};

/**
 * default processor
 * 
 * @param {any} api
 * @param {any} res
 */
function defaultProcessor(api, onResult, environment, req, res, next) {
    const result = onResult ? onResult(api.response) : api.response;
    switch (api.type) {
        case 'jsonp':
            res.jsonp(result);
            break;
        case 'file':
            res.download(result);
            break;
        case 'status':
            res.sendStatus(result);
            break;
        default:
            res.json(result)
            break;
    }
}

const methods = ['get', 'post', 'put', 'delete', 'patch'];

/**
 * HTTP method
 * 
 * @param {string} method
 * @returns
 */
function getMethod(method) {
    if (typeof method === 'undefined') {
        return methods[0];
    } else {
        method = method.toLowerCase();
        if (methods.indexOf(method) !== -1) {
            return method;
        } else {
            return methods[0];
        }
    }
}