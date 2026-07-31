// THROWAWAY route for AiExtractionTest — see that island's file comment.
import { createRoute } from "honox/factory";
import AiExtractionTest from "../../islands/ai-extraction-test";
import { listProjects } from "../../lib/projects";

export default createRoute(async (c) => {
	const projects = await listProjects();
	return c.render(
		<AiExtractionTest
			projects={projects.map((project) => ({
				slug: project.slug,
				title: project.title,
			}))}
		/>,
	);
});
