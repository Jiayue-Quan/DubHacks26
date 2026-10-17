export function Background({ images }: { images: string[] }) {
  return (
    <div className="scene-art" aria-hidden>
      {images.map((src, index) => (
        <img
          key={src}
          src={src}
          alt=""
          className={`scene-art-layer layer-${index % 2}`}
        />
      ))}
    </div>
  );
}
