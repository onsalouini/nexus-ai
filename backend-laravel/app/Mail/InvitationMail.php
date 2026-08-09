<?php

namespace App\Mail;

use App\Models\Invitation;
use App\Services\GroqService;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class InvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Invitation $invitation) {}

    public function build()
    {
        $link = rtrim(config('app.frontend_url'), '/') . '/signup?token=' . $this->invitation->token;

        $intro = app(GroqService::class)->generateInvitationIntro(
            $this->invitation->first_name ?? 'là',
            $this->invitation->role,
            $this->invitation->company->name ?? 'l\'entreprise'
        ) ?? "Vous avez été invité(e) à rejoindre votre espace de travail.";

        return $this->subject('Invitation à rejoindre NEXUS AI')
            ->view('emails.invitation')
            ->with(['link' => $link, 'invitation' => $this->invitation, 'intro' => $intro]);
    }
}