export interface Post {
    id: string;
    title: string;
    description: string;
    creation: Date;
    location: string;
    image: string;
    authorAlias?: string;
    authorImagenPerfil?: string;
}