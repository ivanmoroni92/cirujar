import { Post } from "./_models";
export const IS_MOCK = false;

export const MOCK_IMAGES = [
    'https://uvn-brightspot.s3.amazonaws.com/assets/vixes/imj/hogartotal/I/Ideas-para-reciclar-muebles-viejos.jpg',
    'https://i.pinimg.com/736x/c5/8b/b1/c58bb132ffff5ecac6ba8085df7ff2e2.jpg',
    'https://tse1.mm.bing.net/th/id/OIP.Wo2p-HYRjs3ekNt4fI4-oAHaE8?rs=1&pid=ImgDetMain&o=7&rm=3',
    'https://s-media-cache-ak0.pinimg.com/originals/9a/90/a0/9a90a054ebcc50f62d5f34d2efa0ca77.jpg',
    'https://tse3.mm.bing.net/th/id/OIP.FhRBbYLgkZlUhxZoGqebXwHaEK?rs=1&pid=ImgDetMain&o=7&rm=3',
    'https://tse1.explicit.bing.net/th/id/OIP.-_vonYcGZgVXiJMhY9JeDQHaE8?rs=1&pid=ImgDetMain&o=7&rm=3',
    'https://th.bing.com/th/id/R.a93806c500a826832286add8b60453b5?rik=NHla3ip%2f79KR0w&pid=ImgRaw&r=0',
    "_link_invalido_para_mostrar_imagen_default_"
  ]
  
export const MOCK_POSTS: Post[] = Array.from({ length: 20 }, (_, i) => ({
  id: String(i),
  title: 'Título publicación',
  description: 'Descripción',
  creation: new Date("2026-04-28T12:00:00Z"),
  location: 'Ubicación',
  image: MOCK_IMAGES[Math.floor(Math.random() * MOCK_IMAGES.length)]
}));