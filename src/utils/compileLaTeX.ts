import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile, readFile, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DateTime } from "luxon";
import logger from './logger.js';

const execFileAsync = promisify(execFile);

export async function compileLatexToPdfBuffer(rawLatex: string, user: string): Promise<Buffer> {
  const tempDir = await mkdtemp(join(tmpdir(), 'latex-compile-'));
  const texPath = join(tempDir, 'document.tex');
  const pdfPath = join(tempDir, 'document.pdf');
  const logPath = join(tempDir, 'document.log');

  const now = DateTime.now().setLocale('fr');
  
  const document = `
\\documentclass[12pt]{article}

\\usepackage{amsmath}
\\usepackage{amsfonts}
\\usepackage{amssymb}
\\usepackage{mathtools} 
\\usepackage{stmaryrd} 
\\usepackage{microtype}
\\usepackage{fancyhdr}

\\usepackage{mathrsfs} 
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{lmodern}

\\usepackage{esint} 
\\usepackage{physics} 
\\usepackage{geometry}

\\geometry{a4paper, margin=2cm}
\\setlength{\\headheight}{15pt}

\\pagestyle{fancy}
\\fancyhf{}

\\lhead{Transcription de l'Oral de ${user}}  
\\chead{}                                        
\\rhead{${now.toFormat("cccc d MMMM yyyy 'à' HH'h'mm")}}              

\\lfoot{}   
\\cfoot{Document généré par IA, peut contenir des erreurs}                 
\\rfoot{}

\\allowdisplaybreaks
\\emergencystretch=3em
\\binoppenalty=300 
\\relpenalty=300

\\begin{document}
${rawLatex}
\\end{document}
`;

  try {
    await writeFile(texPath, document);
    
    await execFileAsync('pdflatex', [
      '-interaction=nonstopmode',
      '-halt-on-error',
      '-output-directory', tempDir,
      texPath
    ]);

    return await readFile(pdfPath);

  } catch (error) {

    let latexLog = '';
    try {
      latexLog = await readFile(logPath, 'utf-8');
      const lines = latexLog.split('\n');
      latexLog = lines.slice(-20).join('\n');
    } catch {
      latexLog = 'No log file generated (pdflatex binary missing or failed to start).';
    }

    logger.error(latexLog);    
    logger.error(rawLatex);
        
    throw new Error(`pdflatex compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}
