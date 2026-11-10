# Security policy

`@hussmartinez/ui` renders inside every `@hussmartinez` SDK's editor and inside other people's applications, often next to content from untrusted files. A vulnerability here reaches all of them, so reports are among the most valuable this project can receive. Thank you for taking the time to report one privately.

## Reporting a vulnerability

**Please don't open a public issue, pull request or discussion.**

Report it through GitHub's private vulnerability reporting: open the repository's **Security** tab and choose **Report a vulnerability**, or go directly to [the advisory form](https://github.com/hussmartinez/ui/security/advisories/new). Only the maintainer can see the report.

Please include:

- the affected version, or the commit;
- what an attacker can do, and under which conditions;
- steps to reproduce it, or a proof of concept.

## What to expect

- **Acknowledgement** within 7 days.
- **Updates** at least every 14 days until the issue is resolved.
- **A fix and an advisory.** Once a fix is released, a GitHub Security Advisory describes the issue, with a CVE where it applies. You're credited in the advisory unless you'd rather not be.
- **Coordinated disclosure.** Please keep the issue private until the advisory is published, or for 90 days after your report, whichever comes first. If a fix needs longer, we'll agree on a date with you.

## Supported versions

The package is pre-1.0. Security fixes go into the latest release only. No version has been published yet.

## Scope

In scope is everything in this repository: `@hussmartinez/ui`, the workflows that verify and release it, and the published package. Examples:

- text or props rendered as markup, or anything else that lets content inject HTML or script into the page;
- theme values, such as those passed to `createTheme` or `themeToCss`, that can break out of their CSS declaration and inject rules or markup;
- styles that escape their `hm-` scope and change the host page ([ADR 0005](https://github.com/hussmartinez/sdk-core/blob/main/docs/adr/0005-plain-css-with-cascade-layers.md));
- anything that requires a weaker Content Security Policy than documented, such as `unsafe-eval`;
- any network request the package makes, including fonts, which are never fetched;
- weaknesses in the build, release or publishing workflows, such as unpinned actions or excessive permissions ([ADR 0015](https://github.com/hussmartinez/sdk-core/blob/main/docs/adr/0015-verification-and-releases.md)).

Out of scope:

- vulnerabilities in a dependency that are already public. Report those upstream, but do tell us if the way we use the dependency makes it exploitable;
- issues that need an already compromised device, browser or build environment;
- accessibility defects. They matter just as much, but report them as a public issue so they can be fixed in the open.

Vulnerabilities in a specific SDK, or in the shared runtime, go to that repository's security policy, such as [sdk-core's](https://github.com/hussmartinez/sdk-core/security/policy).
