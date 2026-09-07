function messageElement(role, text) {
  const message = document.createElement("p");
  message.className = `chat-message ${role}`;
  message.textContent = text;
  return message;
}

export function setupFinanceChat({ supabase, getContext, refreshPayments }) {
  const launcher = document.getElementById("chat-launcher");
  const panel = document.getElementById("chat-panel");
  const close = document.getElementById("chat-close");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const send = document.getElementById("chat-send");
  const messages = document.getElementById("chat-messages");
  const history = [];

  const setOpen = (open) => {
    panel.hidden = !open;
    launcher.setAttribute("aria-expanded", String(open));
    if (open) input.focus();
  };
  launcher.addEventListener("click", () => setOpen(panel.hidden));
  close.addEventListener("click", () => setOpen(false));

  const append = (node) => {
    messages.append(node);
    messages.scrollTop = messages.scrollHeight;
  };

  async function invoke(body) {
    const { data, error } = await supabase.functions.invoke("finance-chat", { body });
    if (error) {
      let code = "";
      try {
        const details = await error.context?.json();
        code = details?.code ?? "";
      } catch {
        // Keep the generic message when the gateway does not return JSON.
      }
      const messages = {
        unauthorized: "ログインの有効期限が切れました。ページを再読み込みしてください。",
        payments_unavailable: "支出データを取得できませんでした。少し待って再度お試しください。",
        gemini_unavailable: "Geminiの無料枠へ接続できませんでした。少し待って再度お試しください。",
        invalid_ai_response: "AIの回答を確認できませんでした。表現を変えて再度お試しください。",
      };
      throw new Error(messages[code] ?? "家計簿AIへ接続できませんでした。少し待ってから再度お試しください。");
    }
    return data;
  }

  function appendProposal(proposal) {
    const card = document.createElement("div");
    card.className = "chat-proposal";
    const title = document.createElement("strong");
    title.textContent = "修正案";
    const detail = document.createElement("span");
    detail.textContent = proposal.summary;
    const apply = document.createElement("button");
    apply.type = "button";
    apply.textContent = "この修正を反映する";
    apply.addEventListener("click", async () => {
      apply.disabled = true;
      try {
        const result = await invoke({ confirm: proposal.token });
        append(messageElement("assistant", result.answer));
        await refreshPayments();
        card.remove();
      } catch (error) {
        append(messageElement("error", error.message));
        apply.disabled = false;
      }
    });
    card.append(title, detail, apply);
    append(card);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    append(messageElement("user", text));
    input.value = "";
    send.disabled = true;
    try {
      const data = await invoke({ message: text, context: getContext(), history });
      append(messageElement("assistant", data.answer));
      history.push(
        { role: "user", text },
        { role: "assistant", text: data.answer }
      );
      if (history.length > 10) history.splice(0, history.length - 10);
      if (data.proposal) appendProposal(data.proposal);
    } catch (error) {
      append(messageElement("error", error.message));
    } finally {
      send.disabled = false;
      input.focus();
    }
  });
}
