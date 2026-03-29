import ResourceVault from "../components/ResourceVault";
import { Helmet } from "react-helmet-async";

export default function Resources({ user }: { user: any }) {
  return (
    <div className="max-w-6xl mx-auto py-8">
      <Helmet>
        <title>Resource Vault | Digital Nexus</title>
        <meta name="description" content="Access and share academic resources, PDFs, and links for OAU students." />
      </Helmet>
      <ResourceVault user={user} isAdmin={user?.email === "banmekeifeoluwa@gmail.com"} />
    </div>
  );
}
