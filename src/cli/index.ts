import { program } from 'commander';
import chalk from 'chalk';

program
  .command('config-cra')
  .description('Integrate Jest Preview with CRA.')
  .action(() => {
    import('./configCra');
  });

program
  .command('clear-cache')
  .description('Clear Jest and Jest Preview cache.')
  .action(() => {
    import('./clearCache');
  });

program.description('Start Jest Preview server.').action(() => {
  import('./server/previewServer');
});

program.parse(process.argv);
