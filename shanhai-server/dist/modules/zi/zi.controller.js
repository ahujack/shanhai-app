"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZiController = exports.AnalyzeZiDto = void 0;
const common_1 = require("@nestjs/common");
const zi_service_1 = require("./zi.service");
class AnalyzeZiDto {
    zi;
    handwriting;
}
exports.AnalyzeZiDto = AnalyzeZiDto;
let ZiController = class ZiController {
    ziService;
    constructor(ziService) {
        this.ziService = ziService;
    }
    async analyze(dto) {
        return this.ziService.analyze(dto.zi, dto.handwriting);
    }
};
exports.ZiController = ZiController;
__decorate([
    (0, common_1.Post)('analyze'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AnalyzeZiDto]),
    __metadata("design:returntype", Promise)
], ZiController.prototype, "analyze", null);
exports.ZiController = ZiController = __decorate([
    (0, common_1.Controller)('zi'),
    __metadata("design:paramtypes", [zi_service_1.ZiService])
], ZiController);
//# sourceMappingURL=zi.controller.js.map