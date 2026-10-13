<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| Messagerie interne (conversations 1-à-1 : chef ↔ direction, chef ↔ employé, client ↔ chef),
| demandes de changement envoyées par le client au chef de projet,
| société du client (invitation + compte).
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('organization', 150)->nullable();
        });

        Schema::table('invitations', function (Blueprint $table) {
            $table->string('organization', 150)->nullable();
        });

        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->timestamp('last_message_at')->nullable()->index();
            $table->timestamps();
        });

        Schema::create('conversation_user', function (Blueprint $table) {
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('last_read_at')->nullable();
            // Dernier message lu (comparaison par id : fiable même pour deux messages dans la même seconde)
            $table->unsignedBigInteger('last_read_message_id')->nullable();
            $table->primary(['conversation_id', 'user_id']);
            $table->index('user_id');
        });

        Schema::create('direct_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('body');
            $table->timestamps();
            $table->index(['conversation_id', 'id']);
        });

        Schema::create('change_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title', 200);
            $table->text('description');
            $table->string('priority', 10)->default('normal');   // low | normal | high
            $table->string('status', 20)->default('pending');    // pending | accepted | in_progress | done | rejected
            $table->text('response')->nullable();
            $table->foreignId('responded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();
            $table->index(['project_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('change_requests');
        Schema::dropIfExists('direct_messages');
        Schema::dropIfExists('conversation_user');
        Schema::dropIfExists('conversations');
        Schema::table('invitations', fn (Blueprint $t) => $t->dropColumn('organization'));
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn('organization'));
    }
};
