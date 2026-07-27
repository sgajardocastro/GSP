import * as lucide from 'lucide-vue-next';

const check = (name) => {
    if (!lucide[name]) console.error(`Missing icon: ${name}`);
};

check('BarChart3');
check('FileText');
check('Eye');
check('ShieldAlert');
check('Calculator');
check('Activity');
check('TrendingDown');
check('ArrowDownRight');
check('ArrowUpRight');
check('AlertTriangle');
check('LineChart');
check('Radio');
check('Map');
check('Zap');
check('CheckCircle2');

console.log("Check complete.");
