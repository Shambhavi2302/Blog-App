export default function ProfileAvatar({ name, image }) {
  return (
    <>
      {image ? (
        <img
          src={image}
          alt={name}
          className="w-14 h-14 rounded-full object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
          <span className="text-white text-2xl font-medium">
            {name?.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </>
  );
}
