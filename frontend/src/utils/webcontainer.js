let instance = null;
let WebContainerRef = null;

export async function bootWebContainer() {
  if (!WebContainerRef) {
    const mod = await import('@webcontainer/api');
    WebContainerRef = mod.WebContainer;
  }
  if (instance) return instance;
  instance = await WebContainerRef.boot();
  return instance;
}

export async function mountProject(files) {
  const wc = await bootWebContainer();
  // Clear existing filesystem first to avoid conflicts
  await wc.mount({});
  await wc.mount(files);
  return wc;
}

export async function runNpmInstall() {
  const wc = await bootWebContainer();
  const proc = await wc.spawn('npm', ['install']);
  return proc; // caller should stream proc.output and await completion
}

export async function runNpmStart(script = 'start') {
  const wc = await bootWebContainer();
  if (script === 'start') {
    const proc = await wc.spawn('npm', ['run', 'start']);
    return proc;
  } else if (script.startsWith('node ')) {
    // Direct node command
    const proc = await wc.spawn('node', [script.substring(5)]);
    return proc;
  } else {
    // Custom npm script
    const proc = await wc.spawn('npm', ['run', script]);
    return proc;
  }
}

export function onServerReady(cb) {
  if (!instance) return;
  instance.on('server-ready', (port, url) => cb({ port, url }));
}

export async function stopAllProcesses() {
  if (!instance) return;
  try {
    console.log('Stopping all WebContainer processes...');
    
    // Kill all running processes
    const processes = instance.processes || [];
    console.log(`Found ${processes.length} processes to kill`);
    
    for (const proc of processes) {
      if (proc && proc.kill) {
        try {
          proc.kill();
          console.log('Killed process:', proc);
        } catch (error) {
          console.warn('Error killing process:', error);
        }
      }
    }
    
    // Also try to kill any remaining node processes
    try {
      console.log('Attempting to kill remaining node processes...');
      await instance.spawn('pkill', ['-f', 'node']);
      console.log('Successfully killed node processes');
    } catch {
      // pkill might not be available or no processes to kill
      console.log('No node processes to kill or pkill not available');
    }
    
    // Wait a bit for processes to fully terminate
    console.log('Waiting for processes to terminate...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Process cleanup completed');
  } catch (error) {
    console.warn('Error stopping processes:', error);
  }
}

export async function resetWebContainer() {
  if (instance) {
    try {
      await stopAllProcesses();
      // Clear the instance to force a fresh boot
      instance = null;
    } catch (error) {
      console.warn('Error resetting WebContainer:', error);
    }
  }
}


