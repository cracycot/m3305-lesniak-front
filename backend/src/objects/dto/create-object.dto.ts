export class CreateObjectDto {
    title: string;
    year: number;
    imageUrl?: string;
    imageAlt?: string;
    imageCaption?: string;
    description?: string;
    categoryId?: number;
    facts?: string[];
}
