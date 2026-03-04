var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
export var MediaTipo;
(function (MediaTipo) {
    MediaTipo["IMAGEN"] = "IMAGEN";
    MediaTipo["VIDEO"] = "VIDEO";
})(MediaTipo || (MediaTipo = {}));
let Media = class Media {
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint' }),
    __metadata("design:type", String)
], Media.prototype, "id", void 0);
__decorate([
    Column({ name: 'publicacion_id', type: 'bigint' }),
    __metadata("design:type", String)
], Media.prototype, "publicationId", void 0);
__decorate([
    Column({ type: 'text' }),
    __metadata("design:type", String)
], Media.prototype, "url", void 0);
__decorate([
    Column({ name: 'tipo', type: 'enum', enum: MediaTipo, enumName: 'media_tipo_enum' }),
    __metadata("design:type", String)
], Media.prototype, "tipo", void 0);
__decorate([
    Column({ name: 'orden', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Media.prototype, "orden", void 0);
__decorate([
    Column({ name: 'descripcion', length: 255, nullable: true }),
    __metadata("design:type", String)
], Media.prototype, "descripcion", void 0);
Media = __decorate([
    Entity({ name: 'media' })
], Media);
export { Media };
