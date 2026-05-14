const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(path.join(process.cwd(), 'src'));
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;
    
    // Replace import paths
    content = content.replace(/@\/app\/dashboard\//g, '@/app/(dashboard)/');
    
    // Replace routing paths
    content = content.replace(/href="\/dashboard"/g, 'href="/"');
    content = content.replace(/href="\/dashboard\//g, 'href="/');
    content = content.replace(/push\('\/dashboard'\)/g, "push('/')");
    content = content.replace(/push\('\/dashboard\//g, "push('/");
    content = content.replace(/push\(`\/dashboard\//g, "push(`/");
    content = content.replace(/redirect\('\/dashboard'\)/g, "redirect('/')");
    content = content.replace(/redirect\('\/dashboard\//g, "redirect('/");
    content = content.replace(/redirect\(`\/dashboard\//g, "redirect(`/");
    content = content.replace(/revalidatePath\('\/dashboard'/g, "revalidatePath('/'");
    content = content.replace(/revalidatePath\('\/dashboard/g, "revalidatePath('/");
    content = content.replace(/window\.location\.href = `\/dashboard\//g, "window.location.href = `/");
    
    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Updated ' + file);
    }
});
