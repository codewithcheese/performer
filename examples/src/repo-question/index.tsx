import { Assistant } from "@performer/core";

async function Repos({ user }: { user: string }) {
  const response = await fetch(
    `https://api.github.com/users/${user}/repos?sort=updated`,
  );
  const repos = await response.json();
  return () => (
    <system>
      {user} GitHub Repositories
      {repos.map(
        (repo: any) => `
        ${repo.full_name}
        ${repo.description}
        `,
      )}
    </system>
  );
}

export function RecentWork({ user }: { user: string }) {
  return () => (
    <>
      <Repos user={user} />
      <user>What has {user} been working on recently?</user>
      <Assistant />
    </>
  );
}
