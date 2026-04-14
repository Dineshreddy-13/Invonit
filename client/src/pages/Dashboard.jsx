import useBusinessStore from "@/store/businessStore";

const Dashboard = () => {
  const business = useBusinessStore((s) => s.business);

  return (
    <div>
      <h1>Welcome{business ? `, ${business.name}` : ""}!</h1>
      <p>Your dashboard is ready.</p>
    </div>
  );
};

export default Dashboard;