export function Background({ images }: { images: string[] }) {
  return (
    <div className="scene-art" aria-hidden>
      {images.map((src, index) => {
        
        const path = src.startsWith("/") ? src.slice(1) : src;
        const fullSrc = `${import.meta.env.BASE_URL}${path}`;

        return (
          <img
            key={src}
            src={fullSrc}
            alt=""
            className={`scene-art-layer layer-${index % 2}`}
          />
        );
      })}
    </div>
  );
}