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
const submitButton = quoteForm?.querySelector('button[type="submit"]');

quoteForm?.addEventListener("submit", async (event) => {
	event.preventDefault();
	const formData = new FormData(quoteForm);
	const name = String(formData.get("name") || "").trim();
	formData.set("_subject", `Solar inquiry from ${name || "website visitor"}`);

	if (formNote) formNote.textContent = "Sending your inquiry…";
	if (submitButton) {
		submitButton.disabled = true;
		submitButton.setAttribute("aria-busy", "true");
	}

	try {
		const response = await fetch(quoteForm.action, {
			method: "POST",
			body: formData,
			headers: { Accept: "application/json" },
		});

		if (!response.ok) throw new Error("Form submission failed");
		quoteForm.reset();
		if (formNote)
			formNote.textContent =
				"Thanks — your inquiry has been sent. Our team will be in touch soon.";
	} catch {
		if (formNote)
			formNote.textContent =
				"We couldn't send your inquiry right now. Please email sales@unigloryenergy.com directly.";
	} finally {
		if (submitButton) {
			submitButton.disabled = false;
			submitButton.removeAttribute("aria-busy");
		}
	}
});

document
	.querySelector("#year")
	?.replaceChildren(String(new Date().getFullYear()));
