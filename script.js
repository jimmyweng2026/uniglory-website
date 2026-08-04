const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector("#primary-nav");

const setHeaderState = () => {
	header?.classList.toggle("scrolled", window.scrollY > 18);
};

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

menuToggle?.addEventListener("click", () => {
	const isOpen = primaryNav.classList.toggle("open");
	menuToggle.setAttribute("aria-expanded", String(isOpen));
	menuToggle.setAttribute(
		"aria-label",
		isOpen ? "Close navigation" : "Open navigation",
	);
});

primaryNav?.querySelectorAll("a").forEach((link) => {
	link.addEventListener("click", () => {
		primaryNav.classList.remove("open");
		menuToggle?.setAttribute("aria-expanded", "false");
		menuToggle?.setAttribute("aria-label", "Open navigation");
	});
});

const revealElements = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
	const observer = new IntersectionObserver(
		(entries, currentObserver) => {
			entries.forEach((entry) => {
				if (!entry.isIntersecting) return;
				entry.target.classList.add("visible");
				currentObserver.unobserve(entry.target);
			});
		},
		{ threshold: 0.12, rootMargin: "0px 0px -35px" },
	);
	revealElements.forEach((element) => observer.observe(element));
} else {
	revealElements.forEach((element) => element.classList.add("visible"));
}

const quoteForm = document.querySelector("#quote-form");
const formNote = document.querySelector("#form-note");
quoteForm?.addEventListener("submit", (event) => {
	event.preventDefault();
	const formData = new FormData(quoteForm);
	const name = String(formData.get("name") || "").trim();
	const email = String(formData.get("email") || "").trim();
	const interest = String(formData.get("interest") || "").trim();
	const message = String(formData.get("message") || "").trim();
	const subject = encodeURIComponent(`Solar inquiry from ${name}`);
	const body = encodeURIComponent(
		[
			`Name: ${name}`,
			`Email: ${email}`,
			`Interest: ${interest}`,
			"",
			message ||
				"I would like to learn more about UniGlory Energy supply options.",
		].join("\n"),
	);
	try {
		const mailtoUrl = new URL(
			`mailto:sales@unigloryenergy.com?subject=${subject}&body=${body}`,
		);
		const isAllowedMailto =
			mailtoUrl.protocol === "mailto:" &&
			mailtoUrl.pathname.toLowerCase() === "sales@unigloryenergy.com";
		if (!isAllowedMailto) {
			if (formNote)
				formNote.textContent =
					"Please email sales@unigloryenergy.com directly.";
			return;
		}
		window.location.assign(mailtoUrl.toString());
		if (formNote)
			formNote.textContent =
				"Your email app should open with the inquiry ready to send.";
	} catch {
		if (formNote)
			formNote.textContent = "Please email sales@unigloryenergy.com directly.";
	}
});

document
	.querySelector("#year")
	?.replaceChildren(String(new Date().getFullYear()));
