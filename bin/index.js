#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const YAML = require("yamljs");
const Handlebars = require("handlebars");
const program = require("commander");

program
    .option("-o, --output <path>", "path to spec folder", "./specs")
    ;

var options = {};
var config = {
    "suffix": "-specs",
    "specsExtension": ".js",
    "extension": ".yaml",
    "templateExtension": ".handlebars",
    "templates": "./templates"
};

program.parse(process.argv);
if (program.args.length > 0) {
    loadConfiguration();
    options = applyDefaultOptions(program.opts());

    let fn = setMissingExtension(program.args[0], config.extension)
    execute(fn);
}

function execute(inputFilename) {
    var doc = YAML.parse(fs.readFileSync(inputFilename, "utf8"));

    if (!fs.existsSync(options.output)) {
        fs.mkdirSync(options.output);
    }
    generateSuites(doc.suites);
}

function generateFromTemplate(basename, data) {
    let templateFilename = setMissingExtension(basename, config.templateExtension);
    templateFilename = [config.templates, templateFilename].join("\\");

    let template = Handlebars.compile(fs.readFileSync(templateFilename, "utf8"));
    return template(data);
}

function generateSuites(suites) {
    let data = {};
    suites.forEach(suite => {

        data.title = suite.suite;
        data.tests = suite.tests;

        let result = generateFromTemplate("suite-template", data);
        writeDocument(suite, result);

    })
    
}

function writeDocument(suite, body) {

    let specFilename = getSuiteFilename(suite);
    specFilename = [options.output, specFilename].join("\\");
    fs.writeFileSync(specFilename, body, "utf8");
}

function getSuiteFilename(suite) {
    let basename = getSuiteBasename(suite);
    basename = setMissingExtension(basename, config.suffix);
    return setMissingExtension(basename, config.specsExtension);
}

function getSuiteBasename(suite) {
    let source = (suite.slug) ? suite.slug : suite.suite;
    return slug(source);
}

function slug(source) {
    return source.trim().toLowerCase().replace(/ +/g, "-");
}

function loadConfiguration() {
    let configFilename = "yaml-to-jaspec.json";
    if (fs.existsSync(configFilename)) {
        config = JSON.parse(fs.readFileSync(configFilename, "utf8"));
    }
}

function setMissingExtension(basename, extension) {
    let ext = path.extname(basename);
    if (ext.length == 0) {
        return basename.trim() + extension.trim();
    }
    return basename.trim();
}

function applyDefaultOptions(opts) {
    return opts;
}