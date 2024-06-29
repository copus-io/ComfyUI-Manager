import { api } from "../../scripts/api.js";
import { app } from "../../scripts/app.js";
import { $el, ComfyDialog } from "../../scripts/ui.js";
const env = "dev";

let DEFAULT_HOMEPAGE_URL = "https://copus.io";

let API_ENDPOINT = "https://api.client.prod.copus.io";

if (env !== "prod") {
  API_ENDPOINT = "https://api.dev.copus.io/copus-client";
  DEFAULT_HOMEPAGE_URL = "https://test.copus.io";
}

const style = `
  .openart-share-dialog a {
    color: #f8f8f8;
  }
  .openart-share-dialog a:hover {
    color: #007bff;
  }
  .output_label {
    border: 5px solid transparent;
  }
  .output_label:hover {
    border: 5px solid #59E8C6;
  }
  .output_label.checked {
    border: 5px solid #59E8C6;
  }
`;

// Shared component styles
const sectionStyle = {
  marginBottom: 0,
  padding: 0,
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

export class CopusShareDialog extends ComfyDialog {
  static instance = null;

  constructor() {
    super();
    $el("style", {
      textContent: style,
      parent: document.head,
    });
    this.element = $el(
      "div.comfy-modal.openart-share-dialog",
      {
        parent: document.body,
        style: {
          "overflow-y": "auto",
        },
      },
      [$el("div.comfy-modal-content", {}, [...this.createButtons()])]
    );
    this.selectedOutputIndex = 0;
    this.selectedNodeId = null;
    this.uploadedImages = [];
    this.selectedFile = null;
  }
  // 生成 html 元素
  createButtons() {
    const inputStyle = {
      display: "block",
      minWidth: "500px",
      width: "100%",
      padding: "10px",
      margin: "10px 0",
      borderRadius: "4px",
      border: "1px solid #ddd",
      boxSizing: "border-box",
    };

    const textAreaStyle = {
      display: "block",
      minWidth: "500px",
      width: "100%",
      padding: "10px",
      margin: "10px 0",
      borderRadius: "4px",
      border: "1px solid #ddd",
      boxSizing: "border-box",
      minHeight: "100px",
      background: "#222",
      resize: "vertical",
      color: "#f2f2f2",
    };

    const hyperLinkStyle = {
      display: "block",
      marginBottom: "15px",
      fontWeight: "bold",
      fontSize: "14px",
    };

    const labelStyle = {
      color: "#f8f8f8",
      display: "block",
      margin: "10px 0 0 0",
      fontWeight: "bold",
      textDecoration: "none",
    };

    const buttonStyle = {
      padding: "10px 80px",
      margin: "10px 5px",
      borderRadius: "4px",
      border: "none",
      cursor: "pointer",
      color: "#fff",
      backgroundColor: "#007bff",
    };

    // upload images input
    this.uploadImagesInput = $el("input", {
      type: "file",
      multiple: false,
      style: inputStyle,
      accept: "image/*",
    });

    this.uploadImagesInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) {
        this.previewImage.src = "";
        this.previewImage.style.display = "none";
        return;
      }
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imgData = e.target.result;
        this.previewImage.src = imgData;
        this.previewImage.style.display = "block";
        this.selectedFile = null;
        // Once user uploads an image, we uncheck all radio buttons
        this.radioButtons.forEach((ele) => {
          ele.checked = false;
          ele.parentElement.classList.remove("checked");
        });

        // Add the opacity style toggle here to indicate that they only need
        // to upload one image or choose one from the outputs.
        this.outputsSection.style.opacity = 0.35;
        this.uploadImagesInput.style.opacity = 1;
      };
      reader.readAsDataURL(file);
    });

    // preview image
    this.previewImage = $el("img", {
      src: "",
      style: {
        width: "100%",
        maxHeight: "100px",
        objectFit: "contain",
        display: "none",
        marginTop: "10px",
      },
    });

    this.keyInput = $el("input", {
      type: "password",
      placeholder: "Copy & paste your API key",
      style: inputStyle,
    });
    this.TitleInput = $el("input", {
      type: "text",
      placeholder: "Title (Required)",
      style: inputStyle,
    });
    this.SubTitleInput = $el("input", {
      type: "text",
      placeholder: "Subtitle (Optional)",
      style: inputStyle,
    });
    this.descriptionInput = $el("textarea", {
      placeholder: "content (Optional)",
      style: {
        ...textAreaStyle,
        minHeight: "100px",
      },
    });

    // Header Section
    const headerSection = $el("h3", {
      textContent: "Share your workflow to Copus",
      size: 3,
      color: "white",
      style: {
        "text-align": "center",
        color: "white",
        margin: "0 0 10px 0",
      },
    });
    this.getAPIKeyLink = $el(
      "a",
      {
        style: {
          ...hyperLinkStyle,
          color: "#59E8C6",
        },
        href: DEFAULT_HOMEPAGE_URL,
        target: "_blank",
      },
      ["👉 Get your API key here"]
    );
    const linkSection = $el(
      "div",
      {
        style: {
          marginTop: "10px",
          display: "flex",
          flexDirection: "column",
        },
      },
      [
        // this.communityLink,
        this.getAPIKeyLink,
      ]
    );

    // Account Section
    const accountSection = $el("div", { style: sectionStyle }, [
      $el("label", { style: labelStyle }, ["1️⃣ OpenArt API Key"]),
      this.keyInput,
    ]);

    // Output Upload Section
    const outputUploadSection = $el("div", { style: sectionStyle }, [
      $el(
        "label",
        {
          style: {
            ...labelStyle,
            margin: "10px 0 0 0",
          },
        },
        ["2️⃣ Image/Thumbnail (Required)"]
      ),
      this.previewImage,
      this.uploadImagesInput,
    ]);

    // Outputs Section
    this.outputsSection = $el(
      "div",
      {
        id: "selectOutputs",
      },
      []
    );

    // Additional Inputs Section
    const additionalInputsSection = $el("div", { style: sectionStyle }, [
      $el("label", { style: labelStyle }, ["3️⃣ Title "]),
      this.TitleInput,
    ]);
    const SubtitleSection = $el("div", { style: sectionStyle }, [
      $el("label", { style: labelStyle }, ["4️⃣ Subtitle "]),
      this.SubTitleInput,
    ]);
    const DescriptionSection = $el("div", { style: sectionStyle }, [
      $el("label", { style: labelStyle }, ["5️⃣ Description "]),
      this.descriptionInput,
    ]);
    // switch  between outputs section and additional inputs section
    this.radioButtons = [];

    this.radioButtonsCheck = $el("input", {
      type: "radio",
      name: "output_type",
      value: "0",
      id: "blockchain1",
      checked: true,
    });
    this.radioButtonsCheckOff = $el("input", {
      type: "radio",
      name: "output_type",
      value: "1",
      id: "blockchain",
    });

    const blockChainSection = $el("div", { style: sectionStyle }, [
      $el("label", { style: labelStyle }, ["6️⃣ Store on blockchain "]),
      // swicth 开关
      $el(
        "label",
        {
          style: {
            marginTop: "10px",
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
          },
        },
        [
          this.radioButtonsCheck,
          $el("span", { style: { marginLeft: "5px" } }, ["ON"]),
        ]
      ),
      $el(
        "label",
        { style: { display: "flex", alignItems: "center", cursor: "pointer" } },
        [
          this.radioButtonsCheckOff,
          $el("span", { style: { marginLeft: "5px" } }, ["OFF"]),
        ]
      ),
      // 描述

      $el(
        "p",
        { style: { fontSize: "16px", color: "#fff", margin: "10px 0 0 0" } },
        ["Secure your ownership with a permanent & decentralized storage"]
      ),
    ]);
    // Message Section
    this.message = $el(
      "div",
      {
        style: {
          color: "#ff3d00",
          textAlign: "center",
          padding: "10px",
          fontSize: "20px",
        },
      },
      []
    );

    this.shareButton = $el("button", {
      type: "submit",
      textContent: "Share",
      style: buttonStyle,
      onclick: () => {
        this.handleShareButtonClick();
      },
    });

    // Share and Close Buttons
    const buttonsSection = $el(
      "div",
      {
        style: {
          textAlign: "right",
          marginTop: "20px",
          display: "flex",
          justifyContent: "space-between",
        },
      },
      [
        $el("button", {
          type: "button",
          textContent: "Close",
          style: {
            ...buttonStyle,
            backgroundColor: undefined,
          },
          onclick: () => {
            this.close();
          },
        }),
        this.shareButton,
      ]
    );

    // Composing the full layout
    const layout = [
      headerSection,
      linkSection,
      accountSection,
      outputUploadSection,
      this.outputsSection,
      additionalInputsSection,
      SubtitleSection,
      DescriptionSection,
      // contestSection,
      blockChainSection,
      this.message,
      buttonsSection,
    ];

    return layout;
  }
  /**
   * api 封装
   * @param {url} path 
   * @param {params} options 
   * @param {statusText} statusText 
   * @returns 
   */
  async fetchApi(path, options, statusText) {
    if (statusText) {
      this.message.textContent = statusText;
    }
    const fullPath = new URL(API_ENDPOINT + path);
    const response = await fetch(fullPath, options);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    if (statusText) {
      this.message.textContent = "";
    }
    const data = await response.json();
    return {
      ok: response.ok,
      statusText: response.statusText,
      status: response.status,
      data,
    };
  }
  /**
   * 文件上传
   * @param {file} uploadFile
   */
  async uploadThumbnail(uploadFile) {
    const form = new FormData();
    form.append("file", uploadFile);
    form.append("apiToken", this.keyInput.value);
    try {
      const res = await this.fetchApi(
        `/client/common/opus/uploadImage`,
        {
          method: "POST",
          body: form,
        },
        "Uploading thumbnail..."
      );

      if (res.status && res.data) {
        const { data } = res.data;
        this.uploadedImages.push({
          url: data,
        });
      }
    } catch (e) {
      if (e?.response?.status === 413) {
        throw new Error("File size is too large (max 20MB)");
      } else {
        throw new Error("Error uploading thumbnail: " + e.message);
      }
    }
  }

  async handleShareButtonClick() {
    this.message.textContent = "";
    try {
      this.shareButton.disabled = true;
      this.shareButton.textContent = "Sharing...";
      await this.share();
    } catch (e) {
      alert(e.message);
    }
    this.shareButton.disabled = false;
    this.shareButton.textContent = "Share";
  }
  /**
   * 开始分享
   * @param {string} title
   * @param {string} subtitle
   * @param {string} content
   * @param {boolean} storeOnChain
   * @param {string} coverUrl
   * @param {string[]} imageUrls
   * @param {string} apiToken
   */
  async share() {
    const prompt = await app.graphToPrompt();
    const workflowJSON = prompt["workflow"];
    const form_values = {
      title: this.TitleInput.value,
      subtitle: this.SubTitleInput.value,
      content: this.descriptionInput.value,
      storeOnChain: this.radioButtonsCheck.checked ? true : false,
    };

    if (!this.keyInput.value) {
      throw new Error("API key is required");
    }

    if (!this.uploadImagesInput.files[0] && !this.selectedFile) {
      throw new Error("Thumbnail is required");
    }

    if (!form_values.title) {
      throw new Error("Title is required");
    }

    if (!this.uploadedImages.length) {
      if (this.selectedFile) {
        await this.uploadThumbnail(this.selectedFile);
      } else {
        for (const file of this.uploadImagesInput.files) {
          try {
            await this.uploadThumbnail(file);
          } catch (e) {
            this.uploadedImages = [];
            throw new Error(e.message);
          }
        }

        if (this.uploadImagesInput.files.length === 0) {
          throw new Error("No thumbnail uploaded");
        }
      }
    }
    try {
      const res = await this.fetchApi(
        "/client/common/opus/shareFromComfyUI",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workflowJson: workflowJSON,
            apiToken: this.keyInput.value,
            coverUrl: this.uploadedImages[0].url,
            imageUrls: this.uploadedImages.map((image) => image.url),
            ...form_values,
          }),
        },
        "Uploading workflow..."
      );

      if (res.status && res.data) {
        const { data } = res.data;
        if (data) {
          const url = `${DEFAULT_HOMEPAGE_URL}/work/${data}`;
          this.message.innerHTML = `Workflow has been shared successfully. <a href="${url}" target="_blank">Click here to view it.</a>`;
          this.previewImage.src = "";
          this.previewImage.style.display = "none";
          this.uploadedImages = [];
          this.TitleInput.value = "";
          this.SubTitleInput.value = "";
          this.descriptionInput.value = "";
          this.selectedFile = null;
        }
      }
    } catch (e) {
      throw new Error("Error sharing workflow: " + e.message);
    }
  }
}
