// pages/api/index.ts

import { DeepgramError, createClient } from "@deepgram/sdk";
import { NextResponse } from "next/server";

export default async function handler(req: any, res: any) {
  // Replace 'any' with appropriate types for Request and Response if possible

  // Use req object to invalidate the cache every request
  const url = req.url;
  const deepgram = createClient("f3a5bc99cd3475e419b506390921a9fab2660b9a");

  let { result: projectsResult, error: projectsError } =
    await deepgram.manage.getProjects();

  if (projectsError) {
    return res.json(projectsError);
  }

  const project = projectsResult?.projects[0];

  if (!project) {
    return res.json(
      new DeepgramError(
        "Cannot find a Deepgram project. Please create a project first."
      )
    );
  }

  let { result: newKeyResult, error: newKeyError } =
    await deepgram.manage.createProjectKey(project.project_id, {
      comment: "Temporary API key",
      scopes: ["usage:write"],
      tags: ["next.js"],
      time_to_live_in_seconds: 10,
    });

  if (newKeyError) {
    return res.json(newKeyError);
  }

  return res.json({ ...newKeyResult, url });
}
