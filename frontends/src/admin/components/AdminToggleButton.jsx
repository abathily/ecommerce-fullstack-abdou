import {
  ArrowUpRightIcon,
  ArrowDownLeftIcon
} from '@heroicons/react/24/outline';

export default function AdminToggleButton({ user, onToggle }) {
  if (!user?._id) return null;

  return (
    <button
      onClick={() => onToggle(user)}
      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
    >
      {user.isAdmin ? (
        <>
          <ArrowDownLeftIcon className="h-4 w-4" />
          Retirer admin
        </>
      ) : (
        <>
          <ArrowUpRightIcon className="h-4 w-4" />
          Promouvoir
        </>
      )}
    </button>
  );
}
