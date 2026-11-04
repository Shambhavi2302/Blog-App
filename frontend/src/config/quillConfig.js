import ReactQuill, { Quill } from "react-quill";

const Font = Quill.import("formats/font");

Font.whitelist = ["arial", "georgia", "courier-new","times-new-roman"];

Quill.register(Font, true);

export const modules = {
    toolbar: [
        [{ font: Font.whitelist }],
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["link", "image"],
    ]
};

export const formats = [
    "font",
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "bullet",
    "align",
    "link",
    "image"
];