export async function loadTools() {
    const modules = import.meta.glob("./tools/**/*.tsx");

    const imports = Object.values(modules).map(loader => loader());

    await Promise.all(imports);
}