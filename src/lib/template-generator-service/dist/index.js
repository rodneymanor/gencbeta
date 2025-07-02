"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiClient = exports.TemplateGenerator = void 0;
// Main exports for the template generation service
var template_generator_1 = require("./template-generator");
Object.defineProperty(exports, "TemplateGenerator", {
  enumerable: true,
  get: function () {
    return template_generator_1.TemplateGenerator;
  },
});
var gemini_client_1 = require("./gemini-client");
Object.defineProperty(exports, "GeminiClient", {
  enumerable: true,
  get: function () {
    return gemini_client_1.GeminiClient;
  },
});
// Default export for easy importing
const template_generator_2 = require("./template-generator");
exports.default = template_generator_2.TemplateGenerator;
//# sourceMappingURL=index.js.map
