console.log("Email Write Assistant extension loaded.");

/**
 * Create AI Reply Button
 */
function createAIButton() {

    const button = document.createElement("button");

    button.innerText = "AI Reply";
    button.className = "ai-reply-button";

    // Styling
    button.style.marginRight = "10px";
    button.style.padding = "8px 14px";
    button.style.backgroundColor = "#1a73e8";
    button.style.color = "white";
    button.style.border = "none";
    button.style.borderRadius = "18px";
    button.style.cursor = "pointer";
    button.style.fontSize = "14px";
    button.style.fontWeight = "500";

    return button;
}

/**
 * Get email content
 */
function getEmailContent() {

    const selectors = [
        ".a3s.aiL",
        ".gmail_quote",
        ".ii.gt"
    ];

    for (const selector of selectors) {

        const element = document.querySelector(selector);

        if (element && element.innerText.trim() !== "") {
            return element.innerText.trim();
        }
    }

    return "";
}

/**
 * Find Gmail compose toolbar
 */
function findComposeToolbar() {

    const selectors = [
        ".btC",
        ".aDh",
        '[role="toolbar"]'
    ];

    for (const selector of selectors) {

        const toolbar = document.querySelector(selector);

        if (toolbar) {
            return toolbar;
        }
    }

    return null;
}

/**
 * Insert generated reply into compose box
 */
function insertReplyIntoComposeBox(replyText) {

    const composeBox = document.querySelector(
        '[role="textbox"][g_editable="true"]'
    );

    if (!composeBox) {
        alert("Compose box not found.");
        return;
    }

    composeBox.focus();

    document.execCommand("insertText", false, replyText);
}

/**
 * Inject AI button
 */
function injectButton() {

    // Prevent duplicate button
    if (document.querySelector(".ai-reply-button")) {
        return;
    }

    const toolbar = findComposeToolbar();

    if (!toolbar) {
        console.log("Compose toolbar not found.");
        return;
    }

    console.log("Compose toolbar found.");

    const button = createAIButton();

    button.addEventListener("click", async () => {

        try {

            button.innerText = "Generating...";
            button.disabled = true;

            const emailContent = getEmailContent();

            console.log("Email content:", emailContent);

            const response = await fetch(
                "http://localhost:8080/api/email/generate",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        emailContent: emailContent,
                        tone: "professional"
                    })
                }
            );

            if (!response.ok) {

                const errorText = await response.text();

                throw new Error(
                    `Backend Error: ${response.status} - ${errorText}`
                );
            }

            const generatedReply = await response.text();

            console.log("Generated Reply:", generatedReply);

            insertReplyIntoComposeBox(generatedReply);

        } catch (error) {

            console.error("AI Reply Error:", error);

            alert("Failed to generate AI reply.");

        } finally {

            button.innerText = "AI Reply";
            button.disabled = false;
        }
    });

    toolbar.insertBefore(button, toolbar.firstChild);

    console.log("AI Reply button injected.");
}

/**
 * Observe Gmail DOM changes
 */
const observer = new MutationObserver((mutations) => {

    for (const mutation of mutations) {

        const addedNodes = Array.from(mutation.addedNodes);

        const hasComposeWindow = addedNodes.some((node) => {

            return (
                node.nodeType === Node.ELEMENT_NODE &&
                (
                    node.matches(".aDh, .btC, [role='dialog']") ||
                    node.querySelector(".aDh, .btC, [role='dialog']")
                )
            );
        });

        if (hasComposeWindow) {

            console.log("Compose window detected.");

            setTimeout(() => {
                injectButton();
            }, 1000);
        }
    }
});

/**
 * Start observing
 */
observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log("Extension initialized successfully.");