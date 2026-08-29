import { Router, Request, Response } from 'express';
import { EscrowBot } from '../../services/escrowBotService.js';
import { checkDomainOwnership, checkGitHubRepoOwnership } from '../../services/escrowService.js';
import { FraudBot } from '../../services/fraudBotService.js';
import { serverProjectsStore, EscrowSteps } from '../store.js';

const router = Router();

router.post('/api/escrow/verify-step', async (req: Request, res: Response) => {
  const { projectId, step, status } = req.body;
  
  const proj = serverProjectsStore.find(p => p.id === projectId);
  if (!proj) return res.status(404).json({ error: 'Project not found' });

  if (proj.escrowSteps && step in proj.escrowSteps) {
    let verified = status;
    
    if (status === true) {
      const { details } = req.body;
      if (step === 'domainTransferred') {
        verified = await checkDomainOwnership(details?.domain || 'n/a', details?.buyerEmail || 'n/a');
      } else if (step === 'codeTransferred') {
        verified = await checkGitHubRepoOwnership(details?.repoUrl || 'n/a', details?.buyerUsername || 'n/a');
      }
    }

    proj.escrowSteps[step as keyof EscrowSteps] = verified;
        
    // Auto-complete escrow if all steps done
    const verification = await EscrowBot.verifyAssetTransfer(proj.id, {
      domainTransferred: proj.escrowSteps.domainTransferred,
      codeTransferred: proj.escrowSteps.codeTransferred,
      cloudAccessTransferred: proj.escrowSteps.accountsTransferred
    });

    if (verification.verified) {
      proj.escrowStatus = 'Completed';
      await EscrowBot.releaseFunds(proj.id, proj.sellerId, proj.askingPrice);
    } else {
      proj.escrowStatus = 'Initiated';
    }
    
    return res.json({ success: true, project: proj });
  }
  
  res.status(400).json({ error: 'Invalid escrow step' });
});

router.post('/api/webhooks/escrow', async (req: Request, res: Response) => {
  console.log('[Webhook] Escrow event received:', req.body);
  
  const fraudCheck = await FraudBot.analyzeRisk({
    ipAddress: req.ip || '',
    userAgent: req.headers['user-agent'] || '',
    deviceId: req.body.deviceId || 'unknown',
    paymentMethod: req.body.paymentMethod
  });

  if (fraudCheck.isFraudulent) {
    console.error('[FraudBot] Transaction blocked:', fraudCheck.reason);
    return res.status(403).json({ error: 'Transaction blocked due to fraud risk.' });
  }

  res.status(200).json({ received: true });
});

export default router;
