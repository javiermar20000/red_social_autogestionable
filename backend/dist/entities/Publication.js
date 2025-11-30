var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
export var PublicacionTipo;
(function (PublicacionTipo) {
    PublicacionTipo["PROMOCION"] = "PROMOCION";
    PublicacionTipo["EVENTO"] = "EVENTO";
    PublicacionTipo["AVISO_GENERAL"] = "AVISO_GENERAL";
})(PublicacionTipo || (PublicacionTipo = {}));
export var PublicacionEstado;
(function (PublicacionEstado) {
    PublicacionEstado["BORRADOR"] = "BORRADOR";
    PublicacionEstado["PENDIENTE_VALIDACION"] = "PENDIENTE_VALIDACION";
    PublicacionEstado["PUBLICADA"] = "PUBLICADA";
    PublicacionEstado["VENCIDA"] = "VENCIDA";
    PublicacionEstado["RECHAZADA"] = "RECHAZADA";
})(PublicacionEstado || (PublicacionEstado = {}));
let Publication = class Publication {
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint' }),
    __metadata("design:type", String)
], Publication.prototype, "id", void 0);
__decorate([
    Column({ name: 'negocio_id', type: 'bigint' }),
    __metadata("design:type", String)
], Publication.prototype, "businessId", void 0);
__decorate([
    Column({ name: 'autor_id', type: 'bigint' }),
    __metadata("design:type", String)
], Publication.prototype, "authorId", void 0);
__decorate([
    Column({ length: 255 }),
    __metadata("design:type", String)
], Publication.prototype, "titulo", void 0);
__decorate([
    Column({ type: 'text' }),
    __metadata("design:type", String)
], Publication.prototype, "contenido", void 0);
__decorate([
    Column({
        name: 'tipo',
        type: 'enum',
        enum: PublicacionTipo,
        enumName: 'publicacion_tipo_enum',
    }),
    __metadata("design:type", String)
], Publication.prototype, "tipo", void 0);
__decorate([
    Column({
        name: 'estado',
        type: 'enum',
        enum: PublicacionEstado,
        enumName: 'publicacion_estado_enum',
        default: PublicacionEstado.BORRADOR,
    }),
    __metadata("design:type", String)
], Publication.prototype, "estado", void 0);
__decorate([
    CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Publication.prototype, "fechaCreacion", void 0);
__decorate([
    Column({ name: 'fecha_publicacion', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Publication.prototype, "fechaPublicacion", void 0);
__decorate([
    Column({ name: 'fecha_fin_vigencia', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Publication.prototype, "fechaFinVigencia", void 0);
__decorate([
    Column({ default: 0 }),
    __metadata("design:type", Number)
], Publication.prototype, "visitas", void 0);
Publication = __decorate([
    Entity({ name: 'publicacion' })
], Publication);
export { Publication };
