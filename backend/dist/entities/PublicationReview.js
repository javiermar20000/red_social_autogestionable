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
export var RevisionResultado;
(function (RevisionResultado) {
    RevisionResultado["APROBADA"] = "APROBADA";
    RevisionResultado["RECHAZADA"] = "RECHAZADA";
})(RevisionResultado || (RevisionResultado = {}));
let PublicationReview = class PublicationReview {
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint' }),
    __metadata("design:type", String)
], PublicationReview.prototype, "id", void 0);
__decorate([
    Column({ name: 'publicacion_id', type: 'bigint' }),
    __metadata("design:type", String)
], PublicationReview.prototype, "publicationId", void 0);
__decorate([
    Column({ name: 'revisor_admin_id', type: 'bigint' }),
    __metadata("design:type", String)
], PublicationReview.prototype, "adminId", void 0);
__decorate([
    Column({
        name: 'resultado',
        type: 'enum',
        enum: RevisionResultado,
        enumName: 'revision_resultado_enum',
    }),
    __metadata("design:type", String)
], PublicationReview.prototype, "resultado", void 0);
__decorate([
    Column({ name: 'comentarios_revisor', type: 'text', nullable: true }),
    __metadata("design:type", String)
], PublicationReview.prototype, "comentarios", void 0);
__decorate([
    CreateDateColumn({ name: 'fecha_revision', type: 'timestamptz' }),
    __metadata("design:type", Date)
], PublicationReview.prototype, "fechaRevision", void 0);
PublicationReview = __decorate([
    Entity({ name: 'revision_publicacion' })
], PublicationReview);
export { PublicationReview };
