import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";

export default function IndexPage() {
	return (
		<DefaultLayout>
			<section className="flex flex-col items-center justify-center screen">
				<div className="inline-block max-w-lg text-center justify-center">
					<span className={title()}>Demon&nbsp;</span>
					<span className={title({ color: "violet" })}>Slayer&nbsp;</span>
					<br />
					<span className={title()}>Corps Project Management System</span>
					<div className={subtitle({ class: "mt-4" })}>
						Complete bounty-based task management for programming teams. Join
						the corps and start earning rewards for your contributions.
					</div>
				</div>

				<div className="flex gap-3">
					<Link
						className={buttonStyles({
							color: "primary",
							radius: "full",
							variant: "shadow",
						})}
						href="/login"
					>
						Login
					</Link>
					<Link
						className={buttonStyles({ variant: "bordered", radius: "full" })}
						href="/register"
					>
						Join the Corps
					</Link>
					<Link
						isExternal
						className={buttonStyles({ variant: "bordered", radius: "full" })}
						href={siteConfig.links.github}
					>
						<GithubIcon size={20} />
						GitHub
					</Link>
				</div>
			</section>
		</DefaultLayout>
	);
}
