import { useState } from "react";
import { Upload, FileText, Download, Search } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  type: "PDF" | "Link";
  url: string;
  course: string;
  uploadedBy: string;
}

const mockResources: Resource[] = [
  { id: "1", title: "Law 101 Past Questions", type: "PDF", url: "#", course: "LAW 101", uploadedBy: "Admin" },
  { id: "2", title: "French Vocabulary AOC", type: "Link", url: "#", course: "FRN 101", uploadedBy: "Admin" },
  { id: "3", title: "History 101 Notes", type: "PDF", url: "#", course: "HIS 101", uploadedBy: "Admin" }
];

export default function ResourceVault() {
  const [resources] = useState<Resource[]>(mockResources);
  const [search, setSearch] = useState("");

  const filteredResources = resources.filter(r => 
    r.title.toLowerCase().includes(search.toLowerCase()) || 
    r.course.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h3 className="font-bold text-2xl text-cyan-400 flex items-center gap-2">
          <FileText className="text-cyan-500" /> The Vault
        </h3>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Search resources..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map(resource => (
          <div key={resource.id} className="bg-zinc-900/40 border border-zinc-800/50 p-5 rounded-2xl hover:border-cyan-500/30 transition-all group">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold bg-zinc-800 text-cyan-400 px-2 py-1 rounded-md">
                {resource.course}
              </span>
              <span className="text-xs text-zinc-500">{resource.type}</span>
            </div>
            <h4 className="font-semibold text-white mb-2 line-clamp-2">{resource.title}</h4>
            <p className="text-xs text-zinc-500 mb-4">Uploaded by {resource.uploadedBy}</p>
            
            <a 
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Download size={16} /> Download
            </a>
          </div>
        ))}
        
        <div className="bg-zinc-900/20 border border-dashed border-zinc-700 p-5 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-zinc-900/40 hover:border-cyan-500/50 transition-all cursor-pointer min-h-[160px]">
          <Upload className="text-zinc-500 mb-2" size={24} />
          <p className="text-sm font-medium text-zinc-400">Upload Resource</p>
          <p className="text-xs text-zinc-600 mt-1">PDF or Link</p>
        </div>
      </div>
    </div>
  );
}
