import Link from "next/link";
import { ProjectForm } from "@/components/project-form";
export default function NewProjectPage() { return <main className="page narrow"><Link href="/">← Projects</Link><h1>Create Project</h1><p>Use the existing synopsis exactly; it will become the narration in later steps.</p><ProjectForm /></main>; }
