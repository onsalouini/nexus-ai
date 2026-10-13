<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserAvatar;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/*
| Photo de profil enregistrée dans la base de données (et non sur le disque,
| qui est effacé à chaque redéploiement sur Render). Le chemin exposé au frontend
| est « api/avatars/{id}?v={hash} » : le hash change à chaque nouvelle photo (cache navigateur).
| Sans photo, le frontend affiche les initiales sur la couleur choisie (avatar_color).
*/
class AvatarService
{
    public const COLORS = ['cyan', 'violet', 'emerald', 'amber', 'rose', 'sky', 'indigo', 'slate'];

    public function store(User $user, UploadedFile $file): void
    {
        $data = file_get_contents($file->getRealPath());
        $hash = substr(sha1($data), 0, 12);

        UserAvatar::updateOrCreate(['user_id' => $user->id], [
            'mime' => $file->getMimeType() ?: 'image/jpeg',
            'hash' => $hash,
            'data' => $data,
        ]);

        $this->deleteLegacyFile($user);
        $user->update(['avatar_path' => "api/avatars/{$user->id}?v={$hash}"]);
    }

    public function remove(User $user): void
    {
        UserAvatar::where('user_id', $user->id)->delete();
        $this->deleteLegacyFile($user);
        $user->update(['avatar_path' => null]);
    }

    /** Anciennes photos stockées sur le disque public (avant le stockage en base). */
    private function deleteLegacyFile(User $user): void
    {
        if ($user->avatar_path && ! str_starts_with($user->avatar_path, 'api/')) {
            Storage::disk('public')->delete($user->avatar_path);
        }
    }
}
