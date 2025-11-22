export default function SidebarLeft() {
  return (
    <div className="space-y-4 mt-10">
      <div className="p-2 hover:bg-gray-800 rounded cursor-pointer"> Home</div>
      <div className="p-2 hover:bg-gray-800 rounded cursor-pointer"> Upload Post</div>
      <div className="p-2 hover:bg-gray-800 rounded cursor-pointer"> Messages</div>
      <div className="p-2 hover:bg-gray-800 rounded cursor-pointer"> Notifications</div>
      <div className="p-2 hover:bg-gray-800 rounded cursor-pointer"> Profile</div>
    </div>
  );
}
